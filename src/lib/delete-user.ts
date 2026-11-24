import { SupabaseClient } from '@supabase/supabase-js';
import { logAuditEvent } from '@/lib/audit';
import { retirerLecteurDeLaCorbeille } from '@/lib/corbeille';
import { sendTransactionalEmail } from '@/lib/email';
import { normalizeEmail } from '@/lib/validation';
import * as Sentry from '@sentry/nextjs';

type EtapeAbonnement = 'par-compte' | 'lecture-du-compte' | 'par-adresse';

/**
 * Le compte a des factures, que la loi impose de garder dix ans (OHADA), et la
 * base refuse encore de les détacher du compte (invoices.user_id NOT NULL, ON
 * DELETE RESTRICT). Levée AVANT toute suppression : rien n'est effacé.
 */
export class CompteAvecFactures extends Error {
  constructor() {
    super('Votre compte a des factures, que la loi nous oblige à garder dix ans. Écrivez-nous à contact@nfireport.com\u00A0: nous supprimerons votre compte en les conservant.');
    this.name = 'CompteAvecFactures';
  }
}

/** Code PostgREST d'une table absente : la réplique de test n'a pas toutes les tables. */
const TABLE_ABSENTE = '42P01';

/**
 * Les factures du compte, avant toute suppression. Aucune : rien à faire. Sinon
 * on les détache du compte (user_id vidé, la facture garde son bloc client) ;
 * si la base le refuse encore, la suppression s'arrête là, sans rien effacer.
 * Une lecture impossible arrête aussi tout : mieux vaut ne rien supprimer que
 * laisser un compte à moitié effacé.
 */
async function detacherLesFactures(serviceClient: SupabaseClient, userId: string): Promise<boolean> {
  const { count, error } = await serviceClient
    .from('invoices')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (error) {
    if (error.code === TABLE_ABSENTE) return false;
    throw new Error(`delete-user: factures illisibles (${error.code ?? 'sans code'})`);
  }
  if (!count) return false;
  const { error: detache } = await serviceClient.from('invoices').update({ user_id: null }).eq('user_id', userId);
  if (detache) throw new CompteAvecFactures();
  return true;
}

/** Le rôle du compte supprimé, pour savoir si ses lignes du journal peuvent partir. */
async function roleDuCompte(serviceClient: SupabaseClient, userId: string): Promise<string | null> {
  const { data, error } = await serviceClient.from('user_profiles').select('role').eq('id', userId).maybeSingle();
  if (error && error.code !== TABLE_ABSENTE) {
    throw new Error(`delete-user: profil illisible (${error.code ?? 'sans code'})`);
  }
  return (data as { role?: string } | null)?.role ?? null;
}

/** Échappe le nom et l'adresse avant de les poser dans le courriel. */
function echapper(texte: string): string {
  return texte.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c);
}

/**
 * Signale un abonnement à la newsletter qui n'a pas pu être retiré. Le code
 * seul part chez Sentry : jamais l'adresse, ni le message de la base ou de la
 * requête, qui peut la citer (la valeur filtrée figure dans l'adresse de la
 * requête PostgREST).
 */
function signalerAbonnement(etape: EtapeAbonnement, userId: string, erreur: unknown): void {
  const brut = erreur && typeof erreur === 'object' ? (erreur as { code?: unknown; status?: unknown }) : {};
  const code = typeof brut.code === 'string' && brut.code ? brut.code : typeof brut.status === 'number' ? String(brut.status) : null;
  Sentry.captureException(Object.assign(new Error(`delete-user: abonnement à la newsletter non retiré (${etape})`), { code }), {
    tags: { context: 'delete-user-newsletter' },
    extra: { userId, etape, code },
  });
}

/**
 * L'adresse du compte, lue dans auth.users et mise sous la forme que
 * newsletter_subscribers enregistre, ou null quand le compte n'en a pas (une
 * connexion par téléphone), qu'elle n'a jamais été confirmée, ou qu'elle n'a
 * pas pu être lue (signalé). Une inscription jamais confirmée pose l'adresse
 * dans auth.users sans aucune preuve : n'importe qui peut s'inscrire avec
 * l'adresse d'une abonnée, et supprimer ce compte effacerait son abonnement.
 */
async function adresseDuCompte(serviceClient: SupabaseClient, userId: string): Promise<string | null> {
  try {
    const { data, error } = await serviceClient.auth.admin.getUserById(userId);
    if (error) {
      signalerAbonnement('lecture-du-compte', userId, error);
      return null;
    }
    const email = data.user?.email;
    if (!data.user?.email_confirmed_at) return null;
    return typeof email === 'string' && email.trim() ? normalizeEmail(email) : null;
  } catch (err) {
    signalerAbonnement('lecture-du-compte', userId, err);
    return null;
  }
}

/**
 * Delete a user and all their data from the database.
 * Must be called with a service client (admin privileges).
 */
export async function deleteUserCompletely(
  serviceClient: SupabaseClient,
  userId: string,
  userEmail: string,
  userName: string,
  deletedBy: string,
) {
  // 0. Avant d'effacer quoi que ce soit : les factures (voir CompteAvecFactures)
  // et le rôle du compte.
  const facturesDetachees = await detacherLesFactures(serviceClient, userId);
  const estAdmin = (await roleDuCompte(serviceClient, userId)) === 'admin';

  // 1. Le journal, quand un administrateur supprime le compte d'un autre. Un
  // lecteur qui supprime le sien n'y laisse rien : une ligne à son nom
  // (admin_id, NOT NULL, clé vers son compte) empêcherait la base de
  // supprimer le compte, et la sentinelle « système » n'existe pas en base.
  if (deletedBy !== userId) {
    await logAuditEvent(deletedBy, 'delete_user', 'user', userId, {
      email: userEmail,
      name: userName,
    });
  }

  // 2. Delete from all tables in order (most dependent first)
  const tables = [
    'premium_article_tracking',
    'article_likes',
    'comments',
    'discussion_comments',
    'discussions',
    'newsletter_preferences',
    'payment_requests',
    'subscriptions',
    'auth_attempts',
    'page_views',
    'paywall_analytics',
  ];

  for (const table of tables) {
    try {
      await serviceClient.from(table).delete().eq('user_id', userId);
    } catch {
      // Some tables may not have user_id or may be empty, continue
    }
  }

  // 2 bis. L'abonnement à la newsletter. Le courriel de confirmation promet
  // « Toutes vos données personnelles ont été effacées » : l'adresse ne doit
  // pas survivre dans newsletter_subscribers. Deux lignes peuvent la porter :
  // celle rattachée au compte (user_id), et celle d'une inscription faite
  // avant le compte, sur la liste d'attente du pré-lancement ou au formulaire
  // en visiteur, qui n'a pas de user_id. Les deux partent AVANT le profil et
  // le compte : la base vide user_id quand le compte part (ON DELETE SET
  // NULL, relevé en production), et la ligne, adresse comprise, ne serait plus
  // rattachée à rien. Leurs événements d'envoi restent, sans abonné (ON
  // DELETE SET NULL), pour les chiffres des numéros. Un échec est signalé
  // sans bloquer la suite, comme le nettoyage de la corbeille plus bas.
  try {
    const { error } = await serviceClient.from('newsletter_subscribers').delete().eq('user_id', userId);
    if (error) signalerAbonnement('par-compte', userId, error);
  } catch (err) {
    signalerAbonnement('par-compte', userId, err);
  }
  // L'inscription d'avant le compte se retrouve par l'adresse DU COMPTE, celle
  // d'auth.users, et seulement si elle a été confirmée par courriel. Jamais par
  // celle du profil (userEmail) : la session du lecteur peut réécrire
  // user_profiles.email (politique « Users can update own profile », relevée
  // en production), et une adresse de profil réécrite effacerait
  // l'abonnement d'une autre personne. Comparaison exacte (eq) avec la forme
  // enregistrée, que chaque inscription écrit par normalizeEmail ; jamais
  // ilike ni like, dont « _ » et « % » sont des jokers.
  const adresse = await adresseDuCompte(serviceClient, userId);
  if (adresse) {
    try {
      const { error } = await serviceClient.from('newsletter_subscribers').delete().eq('email', adresse);
      if (error) signalerAbonnement('par-adresse', userId, error);
    } catch (err) {
      signalerAbonnement('par-adresse', userId, err);
    }
  }

  // 2 ter. Les lignes du journal écrites au nom d'un lecteur (mot de passe
  // changé, abonnement expiré…) : leur admin_id pointe vers son compte et son
  // profil sans ON DELETE, la base refuserait sinon de les supprimer. Celles
  // d'un administrateur restent : ce sont ses actions sur les autres comptes.
  if (!estAdmin) {
    const { error } = await serviceClient.from('audit_log').delete().eq('admin_id', userId);
    if (error && error.code !== TABLE_ABSENTE) {
      Sentry.captureException(new Error('delete-user: lignes du journal non retirées'), {
        tags: { context: 'delete-user-journal' },
        extra: { userId, code: error.code },
      });
    }
  }

  // 3. Delete user profile
  await serviceClient.from('user_profiles').delete().eq('id', userId);

  // 4. Delete Supabase Auth user
  const { error: authError } = await serviceClient.auth.admin.deleteUser(userId);
  if (authError) {
    Sentry.captureException(authError, { tags: { context: 'delete-user-auth' }, extra: { userId } });
    throw new Error(`Erreur lors de la suppression du compte auth: ${authError.message}`);
  }

  // 5. La corbeille, puis ce qui a pu s'écrire pendant la suppression. Dans
  // cet ordre, APRÈS le compte : une restauration lancée au même moment ne
  // peut plus remettre la progression de ce lecteur (la base la refuse ou
  // l'efface avec le compte, par la clé étrangère vers auth.users), et le
  // nettoyage retire en une seule instruction ses lignes de toutes les
  // entrées. Les commentaires et j'aime n'ont pas de clé étrangère vers le
  // compte : un commentaire posté depuis un autre onglet pendant la
  // suppression lui survivrait sans ce second passage. Un échec est signalé
  // sans bloquer la fin : le compte est déjà supprimé, et la purge de chaque
  // nuit retire aussi de la corbeille les lignes des comptes disparus.
  try {
    const nettoyage = await retirerLecteurDeLaCorbeille(serviceClient, userId);
    if (!nettoyage.ok) {
      Sentry.captureMessage('delete-user: copies de la corbeille non retirées', {
        level: 'error',
        tags: { context: 'delete-user-corbeille' },
        extra: { userId },
      });
    }
  } catch (err) {
    Sentry.captureException(err, { tags: { context: 'delete-user-corbeille' }, extra: { userId } });
  }
  for (const table of ['comments', 'article_likes']) {
    try {
      const { error } = await serviceClient.from(table).delete().eq('user_id', userId);
      if (error) {
        Sentry.captureException(error, { tags: { context: 'delete-user-second-passage' }, extra: { userId, table } });
      }
    } catch (err) {
      Sentry.captureException(err, { tags: { context: 'delete-user-second-passage' }, extra: { userId, table } });
    }
  }

  // 6. Send confirmation email
  try {
    await sendTransactionalEmail({
      to: userEmail,
      subject: 'Votre compte NFI Report a été supprimé',
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px;">
          <h2 style="color: #111; margin-bottom: 16px;">Compte supprimé</h2>
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            Bonjour ${echapper(userName) || 'cher utilisateur'},
          </p>
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            Votre compte NFI Report associé à l'adresse <strong>${echapper(userEmail)}</strong> a été définitivement supprimé.
            ${facturesDetachees
              ? 'Vos données personnelles ont été effacées, sauf vos factures, que la loi nous oblige à garder dix ans.'
              : 'Toutes vos données personnelles ont été effacées.'}
          </p>
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            Si vous n'êtes pas à l'origine de cette action, contactez-nous immédiatement à contact@nfireport.com.
          </p>
          <p style="color: #999; font-size: 12px; margin-top: 32px;">NFI Report</p>
        </div>
      `,
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { context: 'delete-user-email' } });
  }
}

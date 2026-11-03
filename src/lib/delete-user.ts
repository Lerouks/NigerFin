import { SupabaseClient } from '@supabase/supabase-js';
import { logAuditEvent } from '@/lib/audit';
import { retirerLecteurDeLaCorbeille } from '@/lib/corbeille';
import { sendTransactionalEmail } from '@/lib/email';
import { normalizeEmail } from '@/lib/validation';
import * as Sentry from '@sentry/nextjs';

type EtapeAbonnement = 'par-compte' | 'lecture-du-compte' | 'par-adresse';

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
 * connexion par téléphone) ou qu'elle n'a pas pu être lue (signalé).
 */
async function adresseDuCompte(serviceClient: SupabaseClient, userId: string): Promise<string | null> {
  try {
    const { data, error } = await serviceClient.auth.admin.getUserById(userId);
    if (error) {
      signalerAbonnement('lecture-du-compte', userId, error);
      return null;
    }
    const email = data.user?.email;
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
  // 1. Log deletion BEFORE removing data (for audit trail)
  await logAuditEvent(deletedBy, 'delete_user', 'user', userId, {
    email: userEmail,
    name: userName,
  });

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
  // d'auth.users, que seule une confirmation par courriel change. Jamais par
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
            Bonjour ${userName || 'cher utilisateur'},
          </p>
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            Votre compte NFI Report associé à l'adresse <strong>${userEmail}</strong> a été définitivement supprimé.
            Toutes vos données personnelles ont été effacées.
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

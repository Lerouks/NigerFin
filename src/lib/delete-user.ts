import { SupabaseClient } from '@supabase/supabase-js';
import { logAuditEvent } from '@/lib/audit';
import { retirerLecteurDeLaCorbeille } from '@/lib/corbeille';
import { sendTransactionalEmail } from '@/lib/email';
import * as Sentry from '@sentry/nextjs';

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

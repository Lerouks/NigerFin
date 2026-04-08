import { SupabaseClient } from '@supabase/supabase-js';
import { logAuditEvent } from '@/lib/audit';
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

  // 5. Send confirmation email
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

import { sendTransactionalEmail } from '@/lib/email';
import { welcomeSignupEmail } from '@/lib/email-templates';
import { applyOverridesTo } from '@/lib/emails/overrides';
import { createServiceClient } from '@/lib/supabase';

/**
 * Mail de bienvenue, une seule fois par compte (drapeau welcome_email_sent de
 * user_profiles). Partagé par le retour de lien (/api/auth/callback) et la
 * connexion avec Google (/api/auth/google/retour).
 */
export async function envoyerBienvenueSiNouveau(userId: string, email?: string, fullName?: string) {
  if (!email) return;

  const service = createServiceClient();
  if (!service) return;

  // Check if the profile was just created (no welcome_sent flag)
  const { data: profile } = await service
    .from('user_profiles')
    .select('welcome_email_sent')
    .eq('id', userId)
    .single();

  // Only send once, skip if already sent or column doesn't exist
  if (profile?.welcome_email_sent) return;

  const welcome = await applyOverridesTo('welcome_signup', welcomeSignupEmail(fullName || 'Client'));
  await sendTransactionalEmail({ to: email, ...welcome, emailType: 'welcome_signup', userId });

  // Mark as sent (ignore error if column doesn't exist)
  try {
    await service
      .from('user_profiles')
      .update({ welcome_email_sent: true } as Record<string, unknown>)
      .eq('id', userId);
  } catch {
    // Column may not exist yet
  }
}

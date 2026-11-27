import * as Sentry from '@sentry/nextjs';
import { sendTransactionalEmail } from '@/lib/email';
import { welcomeSignupEmail } from '@/lib/email-templates';
import { applyOverridesTo } from '@/lib/emails/overrides';
import { createServiceClient } from '@/lib/supabase';

/**
 * Mail de bienvenue, une seule fois par compte.
 *
 * L'ancienne garde lisait une colonne welcome_email_sent qui n'a jamais existé :
 * elle ne protégeait rien. La garde est désormais un drapeau dans les données
 * du compte réservées au serveur (app_metadata.bienvenue_envoyee), posé AVANT
 * l'envoi pour que deux appels rapprochés n'envoient pas deux mails. Un compte
 * de plus de sept jours ne reçoit jamais de bienvenue : les anciens comptes,
 * sans drapeau, ne sont pas concernés.
 *
 * Appelée par le retour de Google (/api/auth/google/retour) et par
 * /api/auth/bienvenue (écran de bienvenue, inscription depuis le paiement).
 */

const AGE_MAX_MS = 7 * 24 * 60 * 60 * 1000;

export async function envoyerBienvenueSiNouveau(userId: string, email?: string, fullName?: string): Promise<boolean> {
  if (!email) return false;
  const service = createServiceClient();
  if (!service) return false;

  const { data, error } = await service.auth.admin.getUserById(userId);
  if (error || !data?.user) return false;
  const compte = data.user;
  if (compte.app_metadata?.bienvenue_envoyee === true) return false;
  if (!compte.created_at || Date.now() - Date.parse(compte.created_at) > AGE_MAX_MS) return false;

  const { error: drapeau } = await service.auth.admin.updateUserById(userId, {
    app_metadata: { ...compte.app_metadata, bienvenue_envoyee: true },
  });
  if (drapeau) {
    Sentry.captureException(new Error('bienvenue: drapeau non posé'), { tags: { context: 'welcome-email' }, extra: { userId } });
    return false;
  }

  const welcome = await applyOverridesTo('welcome_signup', welcomeSignupEmail(fullName || 'Client'));
  await sendTransactionalEmail({ to: email, ...welcome, emailType: 'welcome_signup', userId });
  return true;
}

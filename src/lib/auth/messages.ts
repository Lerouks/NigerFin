/**
 * Les erreurs de Supabase arrivent en anglais, avec un code : personne ici ne
 * doit lire d'anglais. Chaque code connu a sa phrase, le reste une phrase
 * générale.
 */

export interface ErreurAuth {
  message: string;
  code?: string;
  status?: number;
}

const PHRASES: Record<string, string> = {
  invalid_credentials: 'Adresse e-mail ou mot de passe incorrect.',
  email_not_confirmed: 'Votre adresse e-mail n’est pas encore confirmée.',
  otp_expired: 'Ce code n’est plus valable. Demandez-en un nouveau.',
  over_email_send_rate_limit: 'Un e-mail vient de partir. Attendez une minute avant d’en demander un autre.',
  over_request_rate_limit: 'Trop de tentatives. Réessayez dans quelques minutes.',
  captcha_failed: 'La vérification anti-robots a échoué. Rechargez la page, puis réessayez.',
  weak_password: 'Ce mot de passe est trop faible. Choisissez-en un autre, de 8 caractères au moins.',
  email_address_invalid: 'Cette adresse e-mail n’est pas valide. Vérifiez-la.',
  email_address_not_authorized: 'Cette adresse e-mail ne peut pas recevoir nos messages. Essayez-en une autre.',
  signup_disabled: 'Les inscriptions sont fermées pour le moment.',
  same_password: 'Le nouveau mot de passe doit être différent de l’ancien.',
  user_already_exists: 'Un compte existe déjà avec cette adresse e-mail.',
  email_exists: 'Un compte existe déjà avec cette adresse e-mail.',
};

export function phraseErreurAuth(erreur: ErreurAuth | null | undefined, defaut = 'Une erreur est survenue. Réessayez.'): string {
  if (!erreur) return defaut;
  if (erreur.code && PHRASES[erreur.code]) return PHRASES[erreur.code]!;
  const m = erreur.message.toLowerCase();
  if (m.includes('invalid login credentials')) return PHRASES.invalid_credentials!;
  if (m.includes('email not confirmed')) return PHRASES.email_not_confirmed!;
  if (m.includes('expired') || (m.includes('invalid') && m.includes('token'))) return PHRASES.otp_expired!;
  if (m.includes('captcha')) return PHRASES.captcha_failed!;
  if (m.includes('rate limit') || (m.includes('after') && m.includes('seconds'))) return PHRASES.over_email_send_rate_limit!;
  if (erreur.status === 429) return PHRASES.over_request_rate_limit!;
  return defaut;
}

export function estNonConfirme(erreur: ErreurAuth | null | undefined): boolean {
  if (!erreur) return false;
  return erreur.code === 'email_not_confirmed' || erreur.message.toLowerCase().includes('email not confirmed');
}

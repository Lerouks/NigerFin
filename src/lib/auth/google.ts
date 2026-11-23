/**
 * Connexion avec Google, menée par nos propres routes sur nfireport.com.
 *
 * Pourquoi pas le retour par Supabase (signInWithOAuth) : Google affiche dans
 * sa fenêtre l'adresse qui reçoit le retour. Avec Supabase, ce serait
 * « golrvonbqivqzywprjoo.supabase.co », une adresse qui n'inspire pas
 * confiance, et Google ne la remplace par notre nom et notre logo qu'après
 * avoir vérifié que chaque domaine nous appartient, ce qui est impossible pour
 * supabase.co. Ici, Google renvoie vers nfireport.com (/api/auth/google/retour),
 * nous échangeons le code contre le jeton d'identité de Google, et Supabase
 * ouvre la session avec ce jeton (signInWithIdToken), après en avoir vérifié la
 * signature, le destinataire et le nonce.
 */

export const GOOGLE_AUTORISATION = 'https://accounts.google.com/o/oauth2/v2/auth';
export const GOOGLE_JETONS = 'https://oauth2.googleapis.com/token';
export const COOKIE_GOOGLE = 'nfi_google';
export const CHEMIN_COOKIE_GOOGLE = '/api/auth/google';
export const CHEMIN_RETOUR_GOOGLE = '/api/auth/google/retour';

/** Ce que la route de départ confie au navigateur, le temps de l'aller-retour chez Google. */
export interface EtatGoogle {
  /** Jeton anti-falsification, renvoyé tel quel par Google (paramètre « state »). */
  etat: string;
  /** Nonce en clair : Google reçoit son empreinte, Supabase compare les deux. */
  nonce: string;
  /** Page du site où renvoyer le lecteur une fois connecté. */
  suite: string;
}

export function identifiantsGoogle(): { clientId: string; secret: string } | null {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const secret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  return clientId && secret ? { clientId, secret } : null;
}

export function jetonAleatoire(octets = 32): string {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(octets))).toString('base64url');
}

/** Empreinte SHA-256 en hexadécimal, la forme du nonce qu'attend Supabase côté Google. */
export async function empreinteSha256(texte: string): Promise<string> {
  const empreinte = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texte));
  return Array.from(new Uint8Array(empreinte), (o) => o.toString(16).padStart(2, '0')).join('');
}

export function encoderEtat(etat: EtatGoogle): string {
  return Buffer.from(JSON.stringify(etat), 'utf8').toString('base64url');
}

export function decoderEtat(brut: string | undefined): EtatGoogle | null {
  if (!brut) return null;
  try {
    const v = JSON.parse(Buffer.from(brut, 'base64url').toString('utf8')) as Partial<EtatGoogle> | null;
    if (v && typeof v.etat === 'string' && typeof v.nonce === 'string' && typeof v.suite === 'string') {
      return { etat: v.etat, nonce: v.nonce, suite: v.suite };
    }
  } catch {
    // cookie illisible : traité comme absent
  }
  return null;
}

/** Comparaison à temps constant, pour le jeton anti-falsification. */
export function memesChaines(a: string, b: string): boolean {
  if (!a || a.length !== b.length) return false;
  let ecart = 0;
  for (let i = 0; i < a.length; i++) ecart |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return ecart === 0;
}

/**
 * Prénom et nom portés par le jeton d'identité. Le jeton est déjà vérifié par
 * Supabase quand on le lit ici : on n'en tire que ces deux libellés.
 */
export function lireNoms(idToken: string): { prenom: string | null; nom: string | null } {
  try {
    const charge = JSON.parse(Buffer.from(idToken.split('.')[1] ?? '', 'base64url').toString('utf8')) as Record<string, unknown>;
    const prenom = typeof charge.given_name === 'string' ? charge.given_name.trim() : '';
    const nom = typeof charge.family_name === 'string' ? charge.family_name.trim() : '';
    return { prenom: prenom || null, nom: nom || null };
  } catch {
    return { prenom: null, nom: null };
  }
}

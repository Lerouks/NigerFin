/**
 * Vérification côté serveur du jeton Turnstile (src/components/securite/Turnstile.tsx).
 *
 * Sans clé secrète (TURNSTILE_SECRET_KEY), le contrôle est éteint et tout
 * passe, comme avant. Avec la clé, un formulaire sans jeton valable est
 * refusé ; si Cloudflare ne répond pas, on laisse passer plutôt que de bloquer
 * un vrai lecteur, les limites par adresse IP restant en place.
 */

const VERIFICATION = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export function turnstileServeurActif(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY);
}

export async function jetonTurnstileValable(jeton: unknown, ip?: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (typeof jeton !== 'string' || !jeton || jeton.length > 2048) return false;
  const corps = new URLSearchParams({ secret, response: jeton });
  if (ip && ip !== 'unknown') corps.set('remoteip', ip);
  try {
    const reponse = await fetch(VERIFICATION, {
      method: 'POST',
      body: corps,
      signal: AbortSignal.timeout(5000),
    });
    if (!reponse.ok) return true;
    const resultat = (await reponse.json()) as { success?: boolean };
    return resultat.success === true;
  } catch {
    return true;
  }
}

export const MESSAGE_TURNSTILE = 'La vérification anti-robots a échoué. Rechargez la page, puis réessayez.';

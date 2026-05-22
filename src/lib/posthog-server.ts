import { PostHog } from 'posthog-node';

let cachedClient: PostHog | null = null;

/**
 * Retourne un singleton PostHog Node SDK pour l'évaluation serveur des feature
 * flags. Utilise le même project API key que le client (NEXT_PUBLIC_POSTHOG_KEY).
 *
 * Le SDK Node fait une évaluation locale des flags (cache rafraîchi en arrière-
 * plan), donc aucun appel réseau supplémentaire n'est fait à chaque check de
 * flag dans un RSC ou une route API.
 *
 * Retourne null si PostHog n'est pas configuré (env vars absentes).
 */
export function getPostHogServer(): PostHog | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return null;

  if (!cachedClient) {
    cachedClient = new PostHog(key, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return cachedClient;
}

/**
 * Force la fermeture du client (utile pour les tests ou shutdown).
 */
export async function closePostHogServer(): Promise<void> {
  if (cachedClient) {
    await cachedClient.shutdown();
    cachedClient = null;
  }
}

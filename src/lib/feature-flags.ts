import {
  FEATURE_FLAG_DEFAULTS,
  type FeatureFlagName,
} from '@/config/feature-flags';
import { getPostHogServer } from '@/lib/posthog-server';

interface FlagUser {
  id: string;
  email?: string | null;
  role?: string | null;
}

/**
 * Évalue un feature flag côté serveur (RSC, API routes, server actions).
 *
 * Utilise l'évaluation locale du SDK Node : zéro appel réseau supplémentaire
 * par requête après le bootstrap initial des flags.
 *
 * @param flag Nom du flag (utiliser FEATURE_FLAGS.X pour la sécurité de type)
 * @param user Utilisateur connecté (null = visiteur anonyme)
 * @returns true si le flag est activé, false sinon (ou en cas d'erreur)
 *
 * @example
 * const showBanner = await isFeatureEnabled(FEATURE_FLAGS.PREMIUM_PROMO_BANNER, user);
 */
export async function isFeatureEnabled(
  flag: FeatureFlagName,
  user: FlagUser | null
): Promise<boolean> {
  const ph = getPostHogServer();
  if (!ph) {
    const fallback = FEATURE_FLAG_DEFAULTS[flag];
    return fallback === true;
  }

  const distinctId = user?.id ?? `anonymous-${flag}`;
  const personProperties: Record<string, string> | undefined = user
    ? {
        ...(user.email ? { email: user.email } : {}),
        ...(user.role ? { role: user.role } : {}),
      }
    : undefined;

  try {
    const result = await ph.isFeatureEnabled(flag, distinctId, {
      personProperties,
    });
    return result === true;
  } catch (error) {
    console.error('[feature-flags] Erreur évaluation flag', flag, error);
    const fallback = FEATURE_FLAG_DEFAULTS[flag];
    return fallback === true;
  }
}

/**
 * Récupère la variante d'un feature flag multi-variant (A/B/C tests).
 *
 * @param flag Nom du flag
 * @param user Utilisateur connecté (null = anonyme)
 * @returns Le nom de la variante (string) ou null si le flag n'est pas un multi-variant
 *
 * @example
 * const variant = await getFeatureVariant(FEATURE_FLAGS.HOME_HERO_VARIANT, user);
 * // variant peut être 'control', 'variant-a', 'variant-b', etc.
 */
export async function getFeatureVariant(
  flag: FeatureFlagName,
  user: FlagUser | null
): Promise<string | null> {
  const ph = getPostHogServer();
  if (!ph) {
    const fallback = FEATURE_FLAG_DEFAULTS[flag];
    return typeof fallback === 'string' ? fallback : null;
  }

  const distinctId = user?.id ?? `anonymous-${flag}`;
  const personProperties: Record<string, string> | undefined = user
    ? {
        ...(user.email ? { email: user.email } : {}),
        ...(user.role ? { role: user.role } : {}),
      }
    : undefined;

  try {
    const result = await ph.getFeatureFlag(flag, distinctId, {
      personProperties,
    });
    return typeof result === 'string' ? result : null;
  } catch (error) {
    console.error('[feature-flags] Erreur récupération variante', flag, error);
    const fallback = FEATURE_FLAG_DEFAULTS[flag];
    return typeof fallback === 'string' ? fallback : null;
  }
}

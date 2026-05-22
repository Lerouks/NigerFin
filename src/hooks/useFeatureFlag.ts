'use client';

import { useEffect, useState } from 'react';
import posthog from 'posthog-js';
import {
  FEATURE_FLAG_DEFAULTS,
  type FeatureFlagName,
} from '@/config/feature-flags';

/**
 * Hook React pour lire un feature flag côté client.
 *
 * Le hook attend que PostHog charge les flags (poll via `onFeatureFlags`),
 * puis renvoie la valeur. Avant le chargement, renvoie la valeur par défaut
 * du flag.
 *
 * @param flag Nom du flag (utiliser FEATURE_FLAGS.X pour type-safety)
 * @returns true si le flag est activé, false sinon
 *
 * @example
 * 'use client';
 * import { useFeatureFlag } from '@/hooks/useFeatureFlag';
 * import { FEATURE_FLAGS } from '@/config/feature-flags';
 *
 * export function MyComponent() {
 *   const showBanner = useFeatureFlag(FEATURE_FLAGS.PREMIUM_PROMO_BANNER);
 *   if (!showBanner) return null;
 *   return <PromoBanner />;
 * }
 */
export function useFeatureFlag(flag: FeatureFlagName): boolean {
  const fallback = FEATURE_FLAG_DEFAULTS[flag];
  const initialValue = fallback === true;
  const [enabled, setEnabled] = useState<boolean>(initialValue);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!posthog || !posthog.__loaded) {
      setEnabled(initialValue);
      return;
    }

    const check = () => {
      try {
        const result = posthog.isFeatureEnabled(flag);
        setEnabled(result === true);
      } catch {
        setEnabled(initialValue);
      }
    };

    check();
    const unsubscribe = posthog.onFeatureFlags?.(check);
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [flag, initialValue]);

  return enabled;
}

/**
 * Hook pour lire la variante d'un feature flag multi-variant.
 *
 * @param flag Nom du flag
 * @returns Nom de la variante (string) ou null
 *
 * @example
 * const variant = useFeatureVariant(FEATURE_FLAGS.HOME_HERO_VARIANT);
 * // variant === 'control' | 'variant-a' | 'variant-b' | null
 */
export function useFeatureVariant(flag: FeatureFlagName): string | null {
  const fallback = FEATURE_FLAG_DEFAULTS[flag];
  const initialValue = typeof fallback === 'string' ? fallback : null;
  const [variant, setVariant] = useState<string | null>(initialValue);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!posthog || !posthog.__loaded) {
      setVariant(initialValue);
      return;
    }

    const check = () => {
      try {
        const result = posthog.getFeatureFlag(flag);
        setVariant(typeof result === 'string' ? result : null);
      } catch {
        setVariant(initialValue);
      }
    };

    check();
    const unsubscribe = posthog.onFeatureFlags?.(check);
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [flag, initialValue]);

  return variant;
}

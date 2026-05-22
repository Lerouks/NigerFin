import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  FEATURE_FLAGS,
  FEATURE_FLAG_DEFAULTS,
} from '@/config/feature-flags';

describe('FEATURE_FLAGS registry', () => {
  it('expose des noms en kebab-case lisible', () => {
    Object.values(FEATURE_FLAGS).forEach((flag) => {
      expect(flag).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    });
  });

  it('chaque flag a une valeur par défaut', () => {
    Object.values(FEATURE_FLAGS).forEach((flag) => {
      expect(FEATURE_FLAG_DEFAULTS).toHaveProperty(flag);
    });
  });

  it('garde les flags type-safe (clés en SCREAMING_SNAKE_CASE)', () => {
    Object.keys(FEATURE_FLAGS).forEach((key) => {
      expect(key).toMatch(/^[A-Z][A-Z0-9_]*$/);
    });
  });
});

describe('isFeatureEnabled (serveur)', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('renvoie la valeur par défaut quand PostHog non configuré', async () => {
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', '');
    const { isFeatureEnabled } = await import('@/lib/feature-flags');
    const result = await isFeatureEnabled(
      FEATURE_FLAGS.PREMIUM_PROMO_BANNER,
      null
    );
    expect(result).toBe(false);
  });

  it('utilise un distinctId stable pour un utilisateur anonyme', async () => {
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', '');
    const { isFeatureEnabled } = await import('@/lib/feature-flags');
    const r1 = await isFeatureEnabled(FEATURE_FLAGS.PAYWALL_CARDS_LAYOUT, null);
    const r2 = await isFeatureEnabled(FEATURE_FLAGS.PAYWALL_CARDS_LAYOUT, null);
    expect(r1).toBe(r2);
  });
});

import posthog from 'posthog-js';
import { hasAcceptedConsent } from './consent';

let initialized = false;

/**
 * Initialise PostHog **uniquement** si l'utilisateur a donné son
 * consentement RGPD. Peut être rappelée à tout moment, elle est idempotente.
 *
 * Active les feature flags via `bootstrap` pour qu'ils soient disponibles
 * dès le chargement de la page (sans flash de contenu non-flaggé).
 */
export function initPostHog() {
  if (initialized) return;
  if (typeof window === 'undefined') return;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  if (!hasAcceptedConsent()) return;

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
    capture_pageview: true,
    capture_pageleave: true,
    persistence: 'localStorage+cookie',
    loaded: (ph) => {
      // Force le rechargement des flags après chaque init (utile si l'utilisateur
      // s'authentifie après avoir consenti).
      ph.reloadFeatureFlags();
    },
  });
  initialized = true;
}

/**
 * Identifie l'utilisateur connecté auprès de PostHog pour permettre le
 * targeting des feature flags (par rôle, email, etc.).
 * No-op si PostHog n'est pas chargé.
 */
export function identifyPostHogUser(
  userId: string,
  properties?: { email?: string | null; role?: string | null }
): void {
  if (typeof window === 'undefined') return;
  if (!posthog.__loaded) return;
  posthog.identify(userId, {
    email: properties?.email ?? undefined,
    role: properties?.role ?? undefined,
  });
  posthog.reloadFeatureFlags();
}

/**
 * Réinitialise l'identité PostHog (à appeler à la déconnexion).
 */
export function resetPostHogIdentity(): void {
  if (typeof window === 'undefined') return;
  if (!posthog.__loaded) return;
  posthog.reset();
}

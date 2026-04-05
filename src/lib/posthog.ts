import posthog from 'posthog-js';
import { hasAcceptedConsent } from './consent';

let initialized = false;

/**
 * Initialise PostHog **uniquement** si l'utilisateur a donné son
 * consentement RGPD. Peut être rappelée à tout moment — elle est idempotente.
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
  });
  initialized = true;
}

export { posthog };

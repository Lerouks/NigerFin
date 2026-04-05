'use client';

import { useEffect } from 'react';
import { AuthProvider } from '@/lib/auth-context';
import { initPostHog } from '@/lib/posthog';
import { hasAcceptedConsent } from '@/lib/consent';

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // N'initialise PostHog que si l'utilisateur a déjà donné son consentement
    // (choix persisté dans localStorage). Sinon, la bannière CookieBanner
    // s'en chargera après acceptation.
    if (hasAcceptedConsent()) {
      initPostHog();
    }
  }, []);

  return <AuthProvider>{children}</AuthProvider>;
}

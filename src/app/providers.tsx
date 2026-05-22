'use client';

import { useEffect } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import {
  initPostHog,
  identifyPostHogUser,
  resetPostHogIdentity,
} from '@/lib/posthog';
import { hasAcceptedConsent } from '@/lib/consent';
import { ToastProvider } from '@/components/Toast';

function PostHogIdentitySync() {
  const { user, profile } = useAuth();

  useEffect(() => {
    if (user) {
      identifyPostHogUser(user.id, {
        email: user.email,
        role: profile?.role,
      });
    } else {
      resetPostHogIdentity();
    }
  }, [user, profile?.role]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // N'initialise PostHog que si l'utilisateur a déjà donné son consentement
    // (choix persisté dans localStorage). Sinon, la bannière CookieBanner
    // s'en chargera après acceptation.
    if (hasAcceptedConsent()) {
      initPostHog();
    }
  }, []);

  return (
    <AuthProvider>
      <PostHogIdentitySync />
      <ToastProvider>{children}</ToastProvider>
    </AuthProvider>
  );
}

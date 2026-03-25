'use client';

import { useEffect } from 'react';
import { AuthProvider } from '@/lib/auth-context';
import { initPostHog } from '@/lib/posthog';

let didInitPostHog = false;

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (didInitPostHog) return;
    didInitPostHog = true;
    initPostHog();
  }, []);

  return <AuthProvider>{children}</AuthProvider>;
}

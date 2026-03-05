'use client';

import { useEffect } from 'react';
import { AuthProvider } from '@/lib/auth-context';
import { initPostHog } from '@/lib/posthog';

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHog();
  }, []);

  return <AuthProvider>{children}</AuthProvider>;
}

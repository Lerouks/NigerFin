import * as Sentry from '@sentry/nextjs';

// Gate Sentry behind explicit cookie consent (RGPD/CNIL).
// Session Replay and performance tracing capture user behaviour,
// so they require opt-in before being activated.
const hasConsent =
  typeof window !== 'undefined' &&
  (() => {
    try {
      return window.localStorage.getItem('nfi_cookie_consent') === 'accepted';
    } catch {
      return false;
    }
  })();

if (hasConsent) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    debug: false,
  });
}

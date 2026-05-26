import * as Sentry from '@sentry/nextjs';
import type { ErrorEvent, EventHint } from '@sentry/nextjs';

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

// Sec H-4 : meme scrubber que cote server. PII (email, userId, telephones, IP)
// stripes avant envoi Sentry.
const PII_KEYS = new Set(['email', 'userId', 'user_id', 'phone', 'phone_number', 'ip', 'ip_address']);

function scrubObject(obj: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (PII_KEYS.has(key)) {
      cleaned[key] = '[redacted]';
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

function beforeSend(event: ErrorEvent, _hint: EventHint): ErrorEvent | null {
  if (event.user) {
    event.user = {
      ...event.user,
      email: undefined,
      ip_address: undefined,
      username: event.user.id ? '[redacted-uid]' : undefined,
      id: event.user.id ? '[redacted-uid]' : undefined,
    };
  }
  if (event.extra) event.extra = scrubObject(event.extra);
  if (event.tags) event.tags = scrubObject(event.tags) as Record<string, string>;
  if (event.contexts) {
    const contexts: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(event.contexts)) {
      contexts[k] = v && typeof v === 'object' ? scrubObject(v as Record<string, unknown>) : v;
    }
    event.contexts = contexts as ErrorEvent['contexts'];
  }
  if (event.request?.cookies) delete event.request.cookies;
  return event;
}

if (hasConsent) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    debug: false,
    beforeSend,
    sendDefaultPii: false,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

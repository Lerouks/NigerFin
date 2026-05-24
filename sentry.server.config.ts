import * as Sentry from '@sentry/nextjs';
import type { ErrorEvent, EventHint } from '@sentry/nextjs';

// Sec H-4 : scrub PII (email, userId) avant envoi a Sentry.
// On garde les infos d'erreur techniques mais on retire les identifiants
// personnels qui pourraient apparaitre via extra/contexts/user/breadcrumbs.
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
  if (event.extra) {
    event.extra = scrubObject(event.extra);
  }
  if (event.tags) {
    event.tags = scrubObject(event.tags) as Record<string, string>;
  }
  if (event.contexts) {
    const contexts: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(event.contexts)) {
      contexts[k] = v && typeof v === 'object' ? scrubObject(v as Record<string, unknown>) : v;
    }
    event.contexts = contexts as ErrorEvent['contexts'];
  }
  if (event.request?.cookies) {
    delete event.request.cookies;
  }
  if (event.request?.headers) {
    const safeHeaders: Record<string, string> = {};
    for (const [k, v] of Object.entries(event.request.headers)) {
      const lower = k.toLowerCase();
      if (lower === 'authorization' || lower === 'cookie' || lower.startsWith('x-webhook')) continue;
      safeHeaders[k] = v;
    }
    event.request.headers = safeHeaders;
  }
  return event;
}

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  debug: false,
  beforeSend,
  sendDefaultPii: false,
});

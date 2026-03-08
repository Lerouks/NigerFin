import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

/**
 * Return a safe 500 response. Logs the real error to Sentry
 * but only returns a generic message to the client.
 */
export function serverError(error: unknown, context?: string) {
  Sentry.captureException(error, { tags: { context: context || 'api' } });
  return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
}

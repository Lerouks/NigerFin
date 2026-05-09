import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { unsubscribeBy } from '@/lib/newsletter/subscribers';
import { SITE_URL } from '@/lib/config';

const PAGE = `${SITE_URL}/newsletter/desabonnement`;

/**
 * GET /api/newsletter/unsubscribe?token=...
 * One-click unsubscribe via the unsubscribe_token UUID stored on the
 * newsletter_subscribers row. Public endpoint (no auth) by design : the
 * token itself is the credential, like a magic link.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(`${PAGE}?error=missing`);
  }

  // Demo / preview / test tokens used in the audit pipeline -> friendly page
  if (['DEMO', 'PREVIEW', 'TEST'].includes(token)) {
    return NextResponse.redirect(`${PAGE}?demo=1`);
  }

  // Validate UUID format (cheap guard avoiding garbage DB lookups)
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) {
    return NextResponse.redirect(`${PAGE}?error=invalid`);
  }

  try {
    const result = await unsubscribeBy('unsubscribe_token', token);
    if (!result.found) {
      return NextResponse.redirect(`${PAGE}?error=notfound`);
    }
    return NextResponse.redirect(`${PAGE}?ok=1${result.alreadyUnsubscribed ? '&already=1' : ''}`);
  } catch (err) {
    Sentry.captureException(err, { tags: { context: 'newsletter-unsubscribe' } });
    return NextResponse.redirect(`${PAGE}?error=server`);
  }
}

/**
 * POST /api/newsletter/unsubscribe
 * RFC 8058 one-click POST handler. Mail clients that send an unsubscribe POST
 * include `List-Unsubscribe=One-Click` in the body, but we accept any POST.
 */
export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  if (!token) {
    return NextResponse.json({ error: 'token requis' }, { status: 400 });
  }
  if (['DEMO', 'PREVIEW', 'TEST'].includes(token)) {
    return NextResponse.json({ ok: true, demo: true });
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) {
    return NextResponse.json({ error: 'token invalide' }, { status: 400 });
  }
  try {
    const result = await unsubscribeBy('unsubscribe_token', token);
    if (!result.found) {
      return NextResponse.json({ error: 'token introuvable' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, alreadyUnsubscribed: result.alreadyUnsubscribed });
  } catch (err) {
    Sentry.captureException(err, { tags: { context: 'newsletter-unsubscribe-post' } });
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}

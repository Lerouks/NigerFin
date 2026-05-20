import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { createServiceClient } from '@/lib/supabase';

interface ResendEvent {
  type: string; // 'email.delivered' | 'email.opened' | 'email.clicked' | 'email.bounced' | 'email.complained' | 'email.delivery_delayed'
  created_at: string;
  data: {
    email_id?: string;
    to?: string[];
    tags?: { name: string; value: string }[];
    subject?: string;
    [k: string]: unknown;
  };
}

const TYPE_MAP: Record<string, 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained' | 'unsubscribed' | null> = {
  'email.delivered': 'delivered',
  'email.opened': 'opened',
  'email.clicked': 'clicked',
  'email.bounced': 'bounced',
  'email.complained': 'complained',
  'email.unsubscribed': 'unsubscribed',
  // Ignored : email.sent, email.delivery_delayed, etc.
};

const SIGNING_SECRET = process.env.RESEND_WEBHOOK_SIGNING_SECRET; // format whsec_...
const LEGACY_SECRET = process.env.RESEND_WEBHOOK_SECRET; // ancien secret shared, fallback transition

/**
 * Vérifie la signature Svix envoyée par Resend.
 * Doc : https://docs.svix.com/receiving/verifying-payloads/how-manual
 * Headers attendus : Svix-Id, Svix-Timestamp, Svix-Signature.
 * Tolerance : 5 minutes pour anti-replay.
 */
function verifySvixSignature(req: NextRequest, rawBody: string): boolean {
  if (!SIGNING_SECRET) return false;
  if (!SIGNING_SECRET.startsWith('whsec_')) {
    Sentry.captureMessage('RESEND_WEBHOOK_SIGNING_SECRET format invalide (doit commencer par whsec_)', { level: 'error' });
    return false;
  }

  const svixId = req.headers.get('svix-id');
  const svixTs = req.headers.get('svix-timestamp');
  const svixSig = req.headers.get('svix-signature');
  if (!svixId || !svixTs || !svixSig) return false;

  // Anti-replay : refus si timestamp > 5 min de décalage
  const tsSec = parseInt(svixTs, 10);
  if (!Number.isFinite(tsSec)) return false;
  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - tsSec) > 300) return false;

  // Décode le secret base64 après le préfixe whsec_
  let secretBytes: Buffer;
  try {
    secretBytes = Buffer.from(SIGNING_SECRET.slice('whsec_'.length), 'base64');
  } catch {
    return false;
  }

  // Signature attendue : HMAC-SHA256 sur "svixId.svixTimestamp.body" -> base64
  const signedContent = `${svixId}.${svixTs}.${rawBody}`;
  const expected = crypto.createHmac('sha256', secretBytes).update(signedContent).digest('base64');
  const expectedBuf = Buffer.from(expected, 'base64');

  // Le header peut contenir plusieurs signatures séparées par espace, format "v1,base64sig"
  const candidates = svixSig.split(' ').map((s) => (s.startsWith('v1,') ? s.slice(3) : s));
  for (const sig of candidates) {
    try {
      const sigBuf = Buffer.from(sig, 'base64');
      if (sigBuf.length === expectedBuf.length && crypto.timingSafeEqual(sigBuf, expectedBuf)) {
        return true;
      }
    } catch {}
  }
  return false;
}

/**
 * Fallback : shared secret via header (pour transition, en attendant Svix sur Resend).
 * Accepté UNIQUEMENT via header X-Webhook-Secret ou Authorization Bearer.
 * Le pattern ?secret=X en query string est SUPPRIMÉ (apparaissait dans les logs Vercel).
 */
function verifyLegacySharedSecret(req: NextRequest): boolean {
  if (!LEGACY_SECRET) return false;
  const provided =
    req.headers.get('x-webhook-secret') ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
  if (!provided) return false;
  try {
    const a = Buffer.from(provided, 'utf8');
    const b = Buffer.from(LEGACY_SECRET, 'utf8');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * POST /api/webhooks/resend
 * Reçoit les événements de delivery Resend et les ingère dans newsletter_events.
 *
 * Authentification (par ordre de préférence) :
 *  1. Signature Svix native (headers Svix-Id + Svix-Timestamp + Svix-Signature)
 *     via RESEND_WEBHOOK_SIGNING_SECRET (format whsec_...). Anti-replay 5 min.
 *  2. Fallback shared secret via header X-Webhook-Secret ou Authorization Bearer
 *     via RESEND_WEBHOOK_SECRET. À retirer après migration complète vers Svix.
 *
 * Le pattern ?secret=X en query string est SUPPRIMÉ (H-3) : il fuit dans les
 * logs Vercel et le CDN, ce qui exposait le secret.
 */
export async function POST(req: NextRequest) {
  if (!SIGNING_SECRET && !LEGACY_SECRET) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  // Auth : Svix d'abord, fallback shared secret header sinon
  const authOk = verifySvixSignature(req, rawBody) || verifyLegacySharedSecret(req);
  if (!authOk) {
    Sentry.captureMessage('Resend webhook auth failed', {
      level: 'warning',
      extra: {
        hasSvixHeaders: !!req.headers.get('svix-signature'),
        hasSharedHeader: !!req.headers.get('x-webhook-secret'),
      },
    });
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const event = JSON.parse(rawBody) as ResendEvent;
    const eventType = TYPE_MAP[event.type];
    if (!eventType) {
      return NextResponse.json({ ignored: true });
    }

    const tags = event.data?.tags ?? [];
    const issueId = tags.find((t) => t.name === 'nfi_issue_id')?.value;
    const subscriberId = tags.find((t) => t.name === 'nfi_subscriber_id')?.value;
    if (!issueId || !subscriberId) {
      return NextResponse.json({ ignored: true, reason: 'Missing nfi tags' });
    }

    const supabase = createServiceClient();
    if (!supabase) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

    // Insert event. On capture les erreurs Supabase pour Sentry sinon les
    // events bounce/complain restent silencieux (audit securite 2026-05-20,
    // critique pour la deliverability newsletter).
    const { error: insertEventError } = await supabase.from('newsletter_events').insert({
      issue_id: issueId,
      subscriber_id: subscriberId,
      event_type: eventType,
      meta: { resend_id: event.data?.email_id, raw: event.data },
    });
    if (insertEventError) {
      Sentry.captureException(insertEventError, {
        tags: { context: 'resend-webhook', op: 'insert-newsletter-event' },
        extra: { issueId, subscriberId, eventType },
      });
    }

    // Side effects on the subscriber
    if (eventType === 'bounced' || eventType === 'complained') {
      const { error: subUpdateError } = await supabase
        .from('newsletter_subscribers')
        .update({ status: eventType, unsubscribed_at: new Date().toISOString() })
        .eq('id', subscriberId);
      if (subUpdateError) {
        Sentry.captureException(subUpdateError, {
          tags: { context: 'resend-webhook', op: 'update-subscriber-bounced-complained' },
          extra: { subscriberId, eventType },
        });
      }
    }
    if (eventType === 'unsubscribed') {
      const { error: unsubError } = await supabase
        .from('newsletter_subscribers')
        .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
        .eq('id', subscriberId);
      if (unsubError) {
        Sentry.captureException(unsubError, {
          tags: { context: 'resend-webhook', op: 'update-subscriber-unsubscribed' },
          extra: { subscriberId },
        });
      }
    }

    // Increment denormalized counter on the issue (bestEffort)
    const counterField =
      eventType === 'opened' ? 'opened_count' :
      eventType === 'clicked' ? 'clicked_count' :
      eventType === 'bounced' ? 'bounced_count' :
      eventType === 'unsubscribed' ? 'unsubscribed_count' :
      null;
    if (counterField) {
      await supabase.rpc('increment_newsletter_counter', { p_issue_id: issueId, p_field: counterField })
        .then(({ error }) => {
          // RPC may not exist yet ; ignore silently
          if (error && !String(error.message).includes('does not exist')) {
            Sentry.captureException(error, { tags: { context: 'webhook-resend-counter' } });
          }
        });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    Sentry.captureException(err, { tags: { context: 'webhook-resend' } });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

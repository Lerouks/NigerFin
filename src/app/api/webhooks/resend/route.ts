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

/**
 * POST /api/webhooks/resend
 * Reçoit les événements de delivery Resend (delivered/opened/clicked/bounced/complained)
 * et les ingère dans newsletter_events. Met à jour le subscriber status pour
 * bounced/complained (auto-désabonnement).
 *
 * Auth : URL secrète via env RESEND_WEBHOOK_SECRET (en query string ?secret=...)
 * Plus tard : signature Svix complète pour anti-replay.
 */
export async function POST(req: NextRequest) {
  const expectedSecret = process.env.RESEND_WEBHOOK_SECRET;
  if (!expectedSecret) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }
  const providedSecret = req.nextUrl.searchParams.get('secret');
  if (providedSecret !== expectedSecret) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const event = (await req.json()) as ResendEvent;
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

    // Insert event
    await supabase.from('newsletter_events').insert({
      issue_id: issueId,
      subscriber_id: subscriberId,
      event_type: eventType,
      meta: { resend_id: event.data?.email_id, raw: event.data },
    });

    // Side effects on the subscriber
    if (eventType === 'bounced' || eventType === 'complained') {
      await supabase
        .from('newsletter_subscribers')
        .update({ status: eventType, unsubscribed_at: new Date().toISOString() })
        .eq('id', subscriberId);
    }
    if (eventType === 'unsubscribed') {
      await supabase
        .from('newsletter_subscribers')
        .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
        .eq('id', subscriberId);
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

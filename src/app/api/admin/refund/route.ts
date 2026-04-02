import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { logAuditEvent } from '@/lib/audit';
import { safeParseJSON } from '@/lib/validation';
import * as Sentry from '@sentry/nextjs';
import Stripe from 'stripe';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured');
  return new Stripe(key, { timeout: 10000 });
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    const { user } = auth;

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
    }

    const body = await safeParseJSON(request);
    if (!body) {
      return NextResponse.json({ error: 'Corps de requête JSON invalide' }, { status: 400 });
    }

    const { paymentIntentId, reason } = body as {
      paymentIntentId?: string;
      reason?: string;
    };

    if (!paymentIntentId || typeof paymentIntentId !== 'string') {
      return NextResponse.json({ error: 'paymentIntentId requis' }, { status: 400 });
    }

    // Validate reason if provided
    const validReasons = ['duplicate', 'fraudulent', 'requested_by_customer'] as const;
    const stripeReason = reason && validReasons.includes(reason as typeof validReasons[number])
      ? (reason as typeof validReasons[number])
      : undefined;

    const stripe = getStripe();

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      ...(stripeReason ? { reason: stripeReason } : {}),
    });

    // Log to audit_log
    await logAuditEvent(
      user.id,
      'refund_created',
      'payment',
      paymentIntentId,
      {
        refund_id: refund.id,
        amount: refund.amount,
        currency: refund.currency,
        status: refund.status,
        reason: stripeReason || 'none',
      }
    );

    return NextResponse.json({
      success: true,
      refund: {
        id: refund.id,
        amount: refund.amount,
        currency: refund.currency,
        status: refund.status,
        payment_intent: refund.payment_intent,
      },
    });
  } catch (err) {
    Sentry.captureException(err, {
      tags: { context: 'admin-refund' },
    });

    if (err instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.statusCode || 400 }
      );
    }

    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

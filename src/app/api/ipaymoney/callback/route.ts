import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { logAuditEvent } from '@/lib/audit';
import { getBillingOption, type BillingCycle } from '@/config/pricing';
import { sendTransactionalEmail } from '@/lib/email';
import { paymentConfirmationEmail } from '@/lib/email-templates';
import { SITE_URL } from '@/lib/config';
import * as Sentry from '@sentry/nextjs';
import crypto from 'crypto';

/**
 * Verify the iPayMoney webhook signature using HMAC-SHA256.
 * The signature is sent in the `x-ipaymoney-signature` header.
 */
function verifySignature(payload: string, signature: string, secret: string): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

/**
 * Activate subscription for a user after successful iPayMoney payment.
 */
async function activateSubscription(
  serviceClient: NonNullable<ReturnType<typeof createServiceClient>>,
  paymentRequestId: string,
  userId: string,
  billingCycle: BillingCycle,
  amount: number,
  iPayMoneyRef: string,
) {
  const billingOption = getBillingOption(billingCycle);
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + billingOption.durationMonths);
  const now = new Date().toISOString();

  // Update payment request to verified
  await serviceClient
    .from('payment_requests')
    .update({
      status: 'verified',
      verified_at: now,
      subscription_expires_at: expiresAt.toISOString(),
      updated_at: now,
    })
    .eq('id', paymentRequestId);

  // Preserve admin role
  const { data: targetProfile } = await serviceClient
    .from('user_profiles')
    .select('role')
    .eq('id', userId)
    .single();

  const role = targetProfile?.role === 'admin' ? 'admin' : 'premium';

  // Upsert subscription
  await serviceClient
    .from('subscriptions')
    .upsert(
      {
        user_id: userId,
        tier: 'premium',
        status: 'active',
        billing_cycle: billingCycle,
        current_period_start: now,
        current_period_end: expiresAt.toISOString(),
        price_amount: amount,
      },
      { onConflict: 'user_id' }
    );

  // Update user profile
  await serviceClient
    .from('user_profiles')
    .update({
      role,
      subscription_status: 'active',
      subscription_start: now,
      subscription_end: expiresAt.toISOString(),
      subscription_updated_at: now,
      expiration_warning_sent: false,
      updated_at: now,
    })
    .eq('id', userId);

  // Audit log
  await logAuditEvent('system', 'ipaymoney_payment_verified', 'payment', paymentRequestId, {
    user_id: userId,
    tier: 'premium',
    billing_cycle: billingCycle,
    amount,
    ipaymoney_ref: iPayMoneyRef,
    expiresAt: expiresAt.toISOString(),
  });

  // Send confirmation email
  const { data: profile } = await serviceClient
    .from('user_profiles')
    .select('email, full_name')
    .eq('id', userId)
    .single();

  if (profile?.email) {
    const confirmation = paymentConfirmationEmail(
      profile.full_name || 'Client',
      'premium',
      billingCycle,
      expiresAt.toISOString(),
    );
    await sendTransactionalEmail({ to: profile.email, ...confirmation }).catch((err) => {
      Sentry.captureException(err, {
        tags: { context: 'ipaymoney-confirmation-email' },
        extra: { userId },
      });
    });
  }
}

/**
 * POST — Server-to-server callback from iPayMoney.
 * Verifies signature, checks payment status, activates subscription.
 */
export async function POST(request: NextRequest) {
  try {
    const secretKey = process.env.IPAYMONEY_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ error: 'iPayMoney non configuré' }, { status: 503 });
    }

    const rawBody = await request.text();
    const signature = request.headers.get('x-ipaymoney-signature') || '';

    // Verify webhook signature
    if (signature && !verifySignature(rawBody, signature, secretKey)) {
      return NextResponse.json({ error: 'Signature invalide' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody) as {
      status?: string;
      transaction_ref?: string;
      ipaymoney_ref?: string;
      amount?: number;
      metadata?: {
        user_id?: string;
        tier?: string;
        billing_cycle?: string;
      };
    };

    const serviceClient = createServiceClient();
    if (!serviceClient) {
      return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });
    }

    const transactionRef = payload.transaction_ref;
    if (!transactionRef) {
      return NextResponse.json({ error: 'transaction_ref manquant' }, { status: 400 });
    }

    // Find the matching payment request
    const { data: paymentRequest } = await serviceClient
      .from('payment_requests')
      .select('*')
      .eq('transaction_number', transactionRef)
      .eq('payment_method', 'ipaymoney')
      .single();

    if (!paymentRequest) {
      return NextResponse.json({ error: 'Transaction introuvable' }, { status: 404 });
    }

    if (paymentRequest.status === 'verified') {
      // Already processed — idempotent
      return NextResponse.json({ success: true, message: 'Déjà traité' });
    }

    if (payload.status === 'success' || payload.status === 'completed') {
      await activateSubscription(
        serviceClient,
        paymentRequest.id,
        paymentRequest.user_id,
        (paymentRequest.billing_cycle || 'monthly') as BillingCycle,
        paymentRequest.amount,
        payload.ipaymoney_ref || transactionRef,
      );

      return NextResponse.json({ success: true });
    }

    if (payload.status === 'failed' || payload.status === 'cancelled') {
      await serviceClient
        .from('payment_requests')
        .update({
          status: 'rejected',
          rejection_reason: `iPayMoney: ${payload.status}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', paymentRequest.id);

      await logAuditEvent('system', 'ipaymoney_payment_failed', 'payment', paymentRequest.id, {
        user_id: paymentRequest.user_id,
        status: payload.status,
        transaction_ref: transactionRef,
      });

      return NextResponse.json({ success: true, status: payload.status });
    }

    // Unknown status — log and acknowledge
    Sentry.captureMessage('iPayMoney callback with unknown status', {
      level: 'warning',
      extra: { status: payload.status, transactionRef },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    Sentry.captureException(err, { tags: { context: 'ipaymoney-callback' } });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * GET — User redirect after payment on iPayMoney.
 * Checks payment status and redirects to success or failure page.
 */
export async function GET(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get('ref');
  const siteUrl = SITE_URL;

  if (!ref) {
    return NextResponse.redirect(`${siteUrl}/pricing?checkout=cancelled`);
  }

  try {
    const secretKey = process.env.IPAYMONEY_SECRET_KEY;
    const apiUrl = process.env.IPAYMONEY_API_URL;
    const serviceClient = createServiceClient();

    if (!secretKey || !apiUrl || !serviceClient) {
      return NextResponse.redirect(`${siteUrl}/pricing?checkout=error`);
    }

    // Verify payment status with iPayMoney API
    const verifyRes = await fetch(`${apiUrl}/payment/verify/${ref}`, {
      headers: {
        'Authorization': `Bearer ${secretKey}`,
      },
    });

    const verifyData = await verifyRes.json().catch(() => null);
    const status = verifyData?.status;

    // Find matching payment request
    const { data: paymentRequest } = await serviceClient
      .from('payment_requests')
      .select('*')
      .eq('transaction_number', ref)
      .eq('payment_method', 'ipaymoney')
      .single();

    if (!paymentRequest) {
      return NextResponse.redirect(`${siteUrl}/pricing?checkout=error`);
    }

    if (paymentRequest.status === 'verified') {
      // Already activated (by webhook)
      return NextResponse.redirect(`${siteUrl}/compte?checkout=success`);
    }

    if (status === 'success' || status === 'completed') {
      await activateSubscription(
        serviceClient,
        paymentRequest.id,
        paymentRequest.user_id,
        (paymentRequest.billing_cycle || 'monthly') as BillingCycle,
        paymentRequest.amount,
        verifyData?.ipaymoney_ref || ref,
      );

      return NextResponse.redirect(`${siteUrl}/compte?checkout=success`);
    }

    // Payment not yet confirmed or failed
    return NextResponse.redirect(`${siteUrl}/pricing?checkout=cancelled`);
  } catch (err) {
    Sentry.captureException(err, { tags: { context: 'ipaymoney-callback-redirect' } });
    return NextResponse.redirect(`${siteUrl}/pricing?checkout=error`);
  }
}

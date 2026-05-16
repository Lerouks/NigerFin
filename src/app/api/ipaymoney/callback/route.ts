import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { logAuditEvent } from '@/lib/audit';
import { getBillingOption, type BillingCycle } from '@/config/pricing';
import { sendTransactionalEmail } from '@/lib/email';
import { paymentConfirmationEmail } from '@/lib/email-templates';
import { issueInvoice } from '@/lib/invoices/issue';
import { getBillingCycleLabel } from '@/config/pricing';
import { SITE_URL } from '@/lib/config';
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/rate-limit';
import * as Sentry from '@sentry/nextjs';

const WEBHOOK_SECRET = process.env.IPAYMONEY_WEBHOOK_SECRET;

/**
 * Vérifie qu'un callback iPayMoney provient bien d'une source autorisée.
 *
 * Trois sources de secret partagé acceptées, par ordre de préférence :
 *  1. Header `X-Webhook-Secret: <secret>` (recommandé, ne fuit pas dans les logs)
 *  2. Header `Authorization: Bearer <secret>`
 *  3. Body field `webhook_secret` (fallback pour SDK iPayMoney/Ifutur qui ne supporterait pas les headers custom)
 *
 * Quand Ifutur livrera leur SDK avec signature HMAC native, ajouter ici la
 * vérification `X-Signature` via crypto.timingSafeEqual(hmacSha256(rawBody, secret), provided).
 *
 * En l'absence de IPAYMONEY_WEBHOOK_SECRET :
 *  - production : refuser tous les callbacks et alerter Sentry (faille critique)
 *  - dev/test   : accepter pour permettre les tests locaux
 */
function verifyWebhookAuth(
  request: NextRequest,
  payload: Record<string, string | number | undefined>,
): boolean {
  if (!WEBHOOK_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      Sentry.captureMessage('IPAYMONEY_WEBHOOK_SECRET non configuré en production', { level: 'error' });
      return false;
    }
    return true;
  }

  const provided =
    request.headers.get('x-webhook-secret') ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim() ||
    (typeof payload.webhook_secret === 'string' ? payload.webhook_secret : null);

  if (!provided) return false;

  try {
    const a = Buffer.from(provided, 'utf8');
    const b = Buffer.from(WEBHOOK_SECRET, 'utf8');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
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
  const { error: payErr } = await serviceClient
    .from('payment_requests')
    .update({
      status: 'verified',
      verified_at: now,
      subscription_expires_at: expiresAt.toISOString(),
      updated_at: now,
    })
    .eq('id', paymentRequestId);

  if (payErr) {
    Sentry.captureException(payErr, { tags: { context: 'ipaymoney-payment-update' } });
  }

  // Preserve admin role
  const { data: targetProfile } = await serviceClient
    .from('user_profiles')
    .select('role')
    .eq('id', userId)
    .single();

  const role = targetProfile?.role === 'admin' ? 'admin' : 'premium';

  // Upsert subscription
  const { error: subErr } = await serviceClient
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

  if (subErr) {
    Sentry.captureException(subErr, { tags: { context: 'ipaymoney-subscription-upsert' } });
  }

  // Update user profile
  const { error: profileErr } = await serviceClient
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

  if (profileErr) {
    Sentry.captureException(profileErr, { tags: { context: 'ipaymoney-profile-update' } });
    // Critical: retry profile update once
    await serviceClient.from('user_profiles').update({
      role, subscription_status: 'active', subscription_start: now,
      subscription_end: expiresAt.toISOString(), subscription_updated_at: now,
      expiration_warning_sent: false, updated_at: now,
    }).eq('id', userId);
  }

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

  // Issue an invoice (fire-and-forget).
  const cycleLabelLower = getBillingCycleLabel(billingCycle).toLowerCase();
  issueInvoice({
    userId,
    amountXof: amount,
    description: `Abonnement Premium NFI Report (${cycleLabelLower})`,
    lineItems: [
      {
        description: `Premium ${cycleLabelLower}, accès illimité aux articles, analyses, simulateurs et briefings exclusifs (du ${new Date(now).toLocaleDateString('fr-FR')} au ${expiresAt.toLocaleDateString('fr-FR')}).`,
        qty: 1,
        unitPriceXof: amount,
        totalXof: amount,
      },
    ],
    paymentMethod: 'iPayMoney',
    paymentReference: iPayMoneyRef,
    billingCycle,
    periodStart: now,
    periodEnd: expiresAt.toISOString(),
  }).catch((err) => {
    Sentry.captureException(err, {
      tags: { context: 'invoice-issue-after-ipaymoney' },
      extra: { userId, iPayMoneyRef },
    });
  });
}

/**
 * POST, Callback from iPayMoney SDK / server.
 * Receives payment status, verifies transaction, activates subscription.
 */
export async function POST(request: NextRequest) {
  try {
    // 1) Rate-limit par IP pour empêcher le brute-force de transaction_id
    const ip = getClientIP(request);
    const rl = await checkRateLimit(`ipaymoney-callback:${ip}`, RATE_LIMITS.paymentCallback.limit, RATE_LIMITS.paymentCallback.windowMs);
    if (rl.limited) {
      Sentry.captureMessage('iPayMoney callback rate-limited', { level: 'warning', extra: { ip } });
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const serviceClient = createServiceClient();
    if (!serviceClient) {
      return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });
    }

    const rawBody = await request.text();
    let payload: Record<string, string | number | undefined>;

    // iPayMoney may send form-encoded or JSON data
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      payload = JSON.parse(rawBody);
    } else {
      // Parse URL-encoded form data
      const params = new URLSearchParams(rawBody);
      payload = Object.fromEntries(params.entries());
    }

    // 2) Vérification de l'authenticité du callback (shared secret en attendant HMAC Ifutur)
    if (!verifyWebhookAuth(request, payload)) {
      Sentry.captureMessage('iPayMoney callback unauthorized', {
        level: 'warning',
        extra: { ip, hasSecret: !!WEBHOOK_SECRET },
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // iPayMoney SDK sends: transaction_id, status, amount, etc.
    const transactionId =
      (payload.transaction_id as string) ||
      (payload.transaction_ref as string) ||
      (payload.transactionId as string);
    const status = payload.status as string | undefined;

    if (!transactionId) {
      Sentry.captureMessage('iPayMoney callback missing transaction ID', {
        level: 'warning',
        extra: { payload },
      });
      return NextResponse.json({ error: 'transaction_id manquant' }, { status: 400 });
    }

    // Find the matching payment request
    const { data: paymentRequest } = await serviceClient
      .from('payment_requests')
      .select('*')
      .eq('transaction_number', transactionId)
      .eq('payment_method', 'ipaymoney')
      .single();

    if (!paymentRequest) {
      return NextResponse.json({ error: 'Transaction introuvable' }, { status: 404 });
    }

    if (paymentRequest.status === 'verified') {
      // Already processed, idempotent
      return NextResponse.json({ success: true, message: 'Déjà traité' });
    }

    if (status === 'success' || status === 'completed' || status === 'successful') {
      // 3) Re-valider amount/billing_cycle contre le pricing canonique
      // Protège contre une manipulation de la table payment_requests qui aurait
      // mis un amount inférieur (race condition, compte service compromis, etc.)
      const billingCycle = (paymentRequest.billing_cycle || 'monthly') as BillingCycle;
      const billingOption = getBillingOption(billingCycle);
      if (!billingOption) {
        Sentry.captureMessage('iPayMoney callback unknown billing cycle', {
          level: 'error',
          extra: { billingCycle, transactionId },
        });
        return NextResponse.json({ error: 'billing_cycle inconnu' }, { status: 400 });
      }
      if (paymentRequest.amount !== billingOption.price) {
        Sentry.captureMessage('iPayMoney callback amount mismatch', {
          level: 'error',
          extra: {
            expected: billingOption.price,
            got: paymentRequest.amount,
            billingCycle,
            transactionId,
            userId: paymentRequest.user_id,
          },
        });
        return NextResponse.json({ error: 'amount mismatch' }, { status: 400 });
      }

      await activateSubscription(
        serviceClient,
        paymentRequest.id,
        paymentRequest.user_id,
        billingCycle,
        paymentRequest.amount,
        transactionId,
      );

      return NextResponse.json({ success: true });
    }

    if (status === 'failed' || status === 'cancelled') {
      await serviceClient
        .from('payment_requests')
        .update({
          status: 'rejected',
          rejection_reason: `iPayMoney: ${status}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', paymentRequest.id);

      await logAuditEvent('system', 'ipaymoney_payment_failed', 'payment', paymentRequest.id, {
        user_id: paymentRequest.user_id,
        status,
        transaction_id: transactionId,
      });

      return NextResponse.json({ success: true, status });
    }

    // Unknown status, log and acknowledge
    Sentry.captureMessage('iPayMoney callback with unknown status', {
      level: 'warning',
      extra: { status, transactionId, payload },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    Sentry.captureException(err, { tags: { context: 'ipaymoney-callback' } });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * GET, User redirect after payment on iPayMoney.
 * Checks payment status and redirects to success or failure page.
 */
export async function GET(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get('ref');
  const siteUrl = SITE_URL;

  if (!ref) {
    return NextResponse.redirect(`${siteUrl}/pricing?checkout=cancelled`);
  }

  try {
    const serviceClient = createServiceClient();
    if (!serviceClient) {
      return NextResponse.redirect(`${siteUrl}/pricing?checkout=error`);
    }

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
      // Already activated (by callback)
      return NextResponse.redirect(`${siteUrl}/compte?checkout=success`);
    }

    // Payment not yet confirmed, show a pending page
    // The callback POST may arrive shortly after the redirect
    return NextResponse.redirect(`${siteUrl}/compte?checkout=pending`);
  } catch (err) {
    Sentry.captureException(err, { tags: { context: 'ipaymoney-callback-redirect' } });
    return NextResponse.redirect(`${siteUrl}/pricing?checkout=error`);
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { MOBILE_MONEY_METHODS, getBillingOption, type MobileMoneyProviderId, type BillingCycle } from '@/config/pricing';
import { getConfiguredProvider } from '@/lib/payment-providers';
import { logAuditEvent } from '@/lib/audit';
import { sendTransactionalEmail } from '@/lib/email';
import { paymentConfirmationEmail } from '@/lib/email-templates';
import * as Sentry from '@sentry/nextjs';

/**
 * POST /api/payment/mobile-money/webhook
 *
 * Receives callbacks from mobile money providers when a payment
 * is completed, failed, or cancelled.
 *
 * Each provider includes a ?provider=<id> query param so we know
 * which provider's webhook format to expect.
 */
export async function POST(request: NextRequest) {
  try {
    const serviceClient = createServiceClient();
    if (!serviceClient) {
      return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });
    }

    // Determine which provider sent this webhook
    const providerId = request.nextUrl.searchParams.get('provider');
    if (!providerId || !(providerId in MOBILE_MONEY_METHODS)) {
      return NextResponse.json({ error: 'Provider inconnu' }, { status: 400 });
    }

    const providerConfig = MOBILE_MONEY_METHODS[providerId as MobileMoneyProviderId];
    if (providerConfig.status !== 'active') {
      return NextResponse.json({ error: 'Provider non actif' }, { status: 400 });
    }

    // Get the provider implementation
    let provider;
    try {
      provider = getConfiguredProvider(providerId as MobileMoneyProviderId);
    } catch {
      return NextResponse.json({ error: 'Provider non configuré' }, { status: 500 });
    }

    // Extract headers and body
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Corps invalide' }, { status: 400 });
    }

    // Process webhook through the provider
    const result = await provider.processWebhook({ headers, body });

    if (!result.valid) {
      Sentry.captureMessage('Invalid mobile money webhook', {
        level: 'warning',
        tags: { provider: providerId },
        extra: { body },
      });
      return NextResponse.json({ error: 'Webhook invalide' }, { status: 400 });
    }

    if (!result.paymentRequestId) {
      return NextResponse.json({ error: 'paymentRequestId manquant' }, { status: 400 });
    }

    // Fetch the payment request
    const { data: paymentRequest, error: fetchError } = await serviceClient
      .from('payment_requests')
      .select('*')
      .eq('id', result.paymentRequestId)
      .single();

    if (fetchError || !paymentRequest) {
      Sentry.captureMessage('Webhook: payment request not found', {
        level: 'error',
        tags: { provider: providerId },
        extra: { paymentRequestId: result.paymentRequestId },
      });
      return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 });
    }

    if (paymentRequest.status !== 'pending') {
      // Already processed — acknowledge but don't reprocess
      return NextResponse.json({ success: true, message: 'Déjà traité' });
    }

    const now = new Date().toISOString();

    if (result.status === 'completed') {
      // Payment succeeded — activate subscription
      const cycle = (paymentRequest.billing_cycle || 'monthly') as BillingCycle;
      const billingOption = getBillingOption(cycle);
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + billingOption.durationMonths);

      // Update payment request
      await serviceClient
        .from('payment_requests')
        .update({
          status: 'verified',
          transaction_number: result.providerTransactionId || paymentRequest.transaction_number,
          verified_at: now,
          subscription_expires_at: expiresAt.toISOString(),
          updated_at: now,
        })
        .eq('id', paymentRequest.id);

      // Preserve admin role
      const { data: targetProfile } = await serviceClient
        .from('user_profiles')
        .select('role')
        .eq('id', paymentRequest.user_id)
        .single();

      const role = targetProfile?.role === 'admin' ? 'admin' : 'premium';

      // Upsert subscription
      await serviceClient
        .from('subscriptions')
        .upsert(
          {
            user_id: paymentRequest.user_id,
            tier: 'premium',
            status: 'active',
            billing_cycle: cycle,
            current_period_start: now,
            current_period_end: expiresAt.toISOString(),
            price_amount: paymentRequest.amount,
          },
          { onConflict: 'user_id' },
        );

      // Update user profile
      await serviceClient
        .from('user_profiles')
        .update({ role, subscription_status: 'active', updated_at: now })
        .eq('id', paymentRequest.user_id);

      // Audit log
      await logAuditEvent('system', 'mobile_money_payment_completed', 'payment', paymentRequest.id, {
        provider: providerId,
        providerTransactionId: result.providerTransactionId,
        amount: paymentRequest.amount,
        billing_cycle: cycle,
      });

      // Send confirmation email
      const { data: profile } = await serviceClient
        .from('user_profiles')
        .select('email, full_name')
        .eq('id', paymentRequest.user_id)
        .single();

      if (profile?.email) {
        const confirmation = paymentConfirmationEmail(
          profile.full_name || 'Client',
          'premium',
          cycle,
          expiresAt.toISOString(),
        );
        await sendTransactionalEmail({ to: profile.email, ...confirmation }).catch(() => {});
      }
    } else {
      // Payment failed or cancelled
      await serviceClient
        .from('payment_requests')
        .update({
          status: 'rejected',
          rejection_reason: result.failureReason || `Paiement ${result.status} via ${providerConfig.shortName}`,
          updated_at: now,
        })
        .eq('id', paymentRequest.id);

      await logAuditEvent('system', 'mobile_money_payment_failed', 'payment', paymentRequest.id, {
        provider: providerId,
        status: result.status,
        failureReason: result.failureReason,
      });
    }

    // Always return 200 to acknowledge the webhook
    return NextResponse.json({ success: true });
  } catch (err) {
    Sentry.captureException(err, { tags: { context: 'mobile-money-webhook' } });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

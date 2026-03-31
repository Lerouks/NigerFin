import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { logAuditEvent } from '@/lib/audit';
import { getBillingOption, type BillingCycle } from '@/config/pricing';
import { sendTransactionalEmail } from '@/lib/email';
import { paymentConfirmationEmail, paymentRejectionEmail } from '@/lib/email-templates';
import { isValidUUID, safeParseJSON, isOneOf } from '@/lib/validation';
import { serverError } from '@/lib/api-error';
import * as Sentry from '@sentry/nextjs';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    const { user, serviceClient } = auth;

    const body = await safeParseJSON(request);
    if (!body) {
      return NextResponse.json({ error: 'Corps de requête JSON invalide' }, { status: 400 });
    }

    const { paymentRequestId, action, rejectionReason } = body as {
      paymentRequestId?: string;
      action?: string;
      rejectionReason?: string;
    };

    if (!paymentRequestId || !isValidUUID(paymentRequestId)) {
      return NextResponse.json({ error: 'paymentRequestId invalide (UUID requis)' }, { status: 400 });
    }

    if (!isOneOf(action, ['verify', 'reject'] as const)) {
      return NextResponse.json({ error: 'Action invalide (verify ou reject)' }, { status: 400 });
    }

    // Get payment request
    const { data: paymentRequest, error: fetchError } = await serviceClient
      .from('payment_requests')
      .select('*')
      .eq('id', paymentRequestId)
      .single();

    if (fetchError || !paymentRequest) {
      return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 });
    }

    if (paymentRequest.status !== 'pending') {
      return NextResponse.json({ error: 'Cette demande a déjà été traitée' }, { status: 400 });
    }

    if (action === 'reject') {
      const { error: updateError } = await serviceClient
        .from('payment_requests')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason || null,
          verified_by: user.id,
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', paymentRequestId);

      if (updateError) {
        Sentry.captureException(updateError, { tags: { context: 'payment-reject-update' } });
        return NextResponse.json({ error: 'Erreur lors du rejet du paiement' }, { status: 500 });
      }

      await logAuditEvent(user.id, 'reject_payment', 'payment', paymentRequestId, {
        target_user_id: paymentRequest.user_id,
        tier: paymentRequest.tier,
        billing_cycle: paymentRequest.billing_cycle,
        amount: paymentRequest.amount,
        payment_method: paymentRequest.payment_method,
        reason: rejectionReason,
      });

      // Send rejection email to user
      const { data: rejectedProfile } = await serviceClient
        .from('user_profiles')
        .select('email, full_name')
        .eq('id', paymentRequest.user_id)
        .single();
      if (rejectedProfile?.email) {
        const rejection = paymentRejectionEmail(rejectedProfile.full_name || 'Client', rejectionReason);
        await sendTransactionalEmail({ to: rejectedProfile.email, ...rejection }).catch((err) => {
          Sentry.captureException(err, { tags: { context: 'payment-rejection-email' }, extra: { userId: paymentRequest.user_id } });
        });
      }

      return NextResponse.json({ success: true, status: 'rejected' });
    }

    // action === 'verify' — duration depends on billing cycle
    const cycle = (paymentRequest.billing_cycle || 'monthly') as BillingCycle;
    const billingOption = getBillingOption(cycle);
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + billingOption.durationMonths);

    const now = new Date().toISOString();

    // Update payment request
    const { error: paymentUpdateError } = await serviceClient
      .from('payment_requests')
      .update({
        status: 'verified',
        verified_by: user.id,
        verified_at: now,
        subscription_expires_at: expiresAt.toISOString(),
        updated_at: now,
      })
      .eq('id', paymentRequestId);

    if (paymentUpdateError) {
      Sentry.captureException(paymentUpdateError, { tags: { context: 'payment-verify-update' } });
      return NextResponse.json({ error: 'Erreur lors de la vérification du paiement' }, { status: 500 });
    }

    // Preserve admin role
    const { data: targetProfile } = await serviceClient
      .from('user_profiles')
      .select('role')
      .eq('id', paymentRequest.user_id)
      .single();

    const role = targetProfile?.role === 'admin' ? 'admin' : 'premium';

    // Upsert subscription
    const { error: subError } = await serviceClient
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
        { onConflict: 'user_id' }
      );

    if (subError) {
      Sentry.captureException(subError, { tags: { context: 'payment-verify-subscription' } });
      return NextResponse.json({ error: 'Erreur lors de la mise à jour de l\'abonnement' }, { status: 500 });
    }

    // Update user profile (including subscription dates for cron expiration)
    const { error: profileError } = await serviceClient
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
      .eq('id', paymentRequest.user_id);

    if (profileError) {
      Sentry.captureException(profileError, { tags: { context: 'payment-verify-profile' } });
      // Don't return error here - subscription was already updated
    }

    await logAuditEvent(user.id, 'verify_payment', 'payment', paymentRequestId, {
      target_user_id: paymentRequest.user_id,
      tier: 'premium',
      billing_cycle: paymentRequest.billing_cycle,
      amount: paymentRequest.amount,
      payment_method: paymentRequest.payment_method,
      expiresAt: expiresAt.toISOString(),
    });

    // Send confirmation email to user
    const { data: verifiedProfile } = await serviceClient
      .from('user_profiles')
      .select('email, full_name')
      .eq('id', paymentRequest.user_id)
      .single();
    if (verifiedProfile?.email) {
      const confirmation = paymentConfirmationEmail(
        verifiedProfile.full_name || 'Client',
        'premium',
        cycle,
        expiresAt.toISOString(),
      );
      await sendTransactionalEmail({ to: verifiedProfile.email, ...confirmation }).catch((err) => {
        Sentry.captureException(err, { tags: { context: 'payment-confirmation-email' }, extra: { userId: paymentRequest.user_id } });
      });
    }

    return NextResponse.json({
      success: true,
      status: 'verified',
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err) {
    return serverError(err, 'payment-verify');
  }
}

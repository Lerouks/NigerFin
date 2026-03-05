import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { logAuditEvent } from '@/lib/audit';
import { cycleMonths } from '@/config/pricing';
import type { BillingCycle } from '@/config/pricing';

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const { user, serviceClient } = auth;

  const { paymentRequestId, action, rejectionReason } = await request.json() as {
    paymentRequestId: string;
    action: 'verify' | 'reject';
    rejectionReason?: string;
  };

  if (!paymentRequestId || !action) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
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
    await serviceClient
      .from('payment_requests')
      .update({
        status: 'rejected',
        rejection_reason: rejectionReason || null,
        verified_by: user.id,
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentRequestId);

    await logAuditEvent(user.id, 'reject_payment', 'payment', paymentRequestId, {
      tier: paymentRequest.tier,
      amount: paymentRequest.amount,
      reason: rejectionReason,
    });

    return NextResponse.json({ success: true, status: 'rejected' });
  }

  // action === 'verify'
  const months = cycleMonths(paymentRequest.billing_cycle as BillingCycle);
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + months);

  const now = new Date().toISOString();

  // Update payment request
  await serviceClient
    .from('payment_requests')
    .update({
      status: 'verified',
      verified_by: user.id,
      verified_at: now,
      subscription_expires_at: expiresAt.toISOString(),
      updated_at: now,
    })
    .eq('id', paymentRequestId);

  // Preserve admin role
  const { data: targetProfile } = await serviceClient
    .from('user_profiles')
    .select('role')
    .eq('id', paymentRequest.user_id)
    .single();

  const role = targetProfile?.role === 'admin'
    ? 'admin'
    : (paymentRequest.tier === 'pro' ? 'pro' : 'standard');

  // Upsert subscription
  await serviceClient
    .from('subscriptions')
    .upsert(
      {
        user_id: paymentRequest.user_id,
        tier: paymentRequest.tier,
        status: 'active',
        billing_cycle: paymentRequest.billing_cycle,
        current_period_start: now,
        current_period_end: expiresAt.toISOString(),
        price_amount: paymentRequest.amount,
      },
      { onConflict: 'user_id' }
    );

  // Update user profile
  await serviceClient
    .from('user_profiles')
    .update({
      role,
      subscription_status: 'active',
      billing_cycle: paymentRequest.billing_cycle,
      updated_at: now,
    })
    .eq('id', paymentRequest.user_id);

  await logAuditEvent(user.id, 'verify_payment', 'payment', paymentRequestId, {
    tier: paymentRequest.tier,
    amount: paymentRequest.amount,
    expiresAt: expiresAt.toISOString(),
  });

  return NextResponse.json({
    success: true,
    status: 'verified',
    expiresAt: expiresAt.toISOString(),
  });
}

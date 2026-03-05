import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase';
import { cycleMonths } from '@/config/pricing';
import type { BillingCycle } from '@/config/pricing';

export async function POST(request: NextRequest) {
  // Verify admin
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  const { paymentRequestId, action, rejectionReason } = await request.json() as {
    paymentRequestId: string;
    action: 'verify' | 'reject';
    rejectionReason?: string;
  };

  if (!paymentRequestId || !action) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
  }

  // Use service client for admin operations
  const serviceClient = createServiceClient();
  if (!serviceClient) {
    return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });
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

  // Map tier to role
  const role = paymentRequest.tier === 'pro' ? 'pro' : 'standard';

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

  // Update user profile role
  await serviceClient
    .from('user_profiles')
    .update({
      role,
      subscription_status: 'active',
      billing_cycle: paymentRequest.billing_cycle,
      updated_at: now,
    })
    .eq('id', paymentRequest.user_id);

  return NextResponse.json({
    success: true,
    status: 'verified',
    expiresAt: expiresAt.toISOString(),
  });
}

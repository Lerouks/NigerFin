import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase';
import { PREMIUM_TIER, PAYMENT_METHODS, type PaymentMethodId } from '@/config/pricing';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const body = await request.json();
  const { tier, billingCycle, paymentMethod, transactionNumber } = body as {
    tier: string;
    billingCycle: string;
    paymentMethod: string;
    transactionNumber: string;
  };

  // Validate tier
  if (tier !== 'premium') {
    return NextResponse.json({ error: 'Plan invalide' }, { status: 400 });
  }

  // Validate billing cycle
  if (billingCycle !== 'monthly') {
    return NextResponse.json({ error: 'Durée invalide' }, { status: 400 });
  }

  // Validate payment method
  if (!paymentMethod || !(paymentMethod in PAYMENT_METHODS)) {
    return NextResponse.json({ error: 'Méthode de paiement invalide' }, { status: 400 });
  }

  // Validate transaction number
  if (!transactionNumber || transactionNumber.trim().length < 3) {
    return NextResponse.json({ error: 'Numéro de transaction requis' }, { status: 400 });
  }

  // Get the correct amount: check dynamic pricing first, then fallback to config
  let amount = PREMIUM_TIER.price;
  const serviceClient = createServiceClient();
  if (serviceClient) {
    const { data: dp } = await serviceClient
      .from('dynamic_pricing')
      .select('amount')
      .eq('tier', 'premium')
      .eq('billing_cycle', 'monthly')
      .single();
    if (dp?.amount) amount = dp.amount;
  }

  // Insert payment request
  const { data, error } = await supabase
    .from('payment_requests')
    .insert({
      user_id: user.id,
      tier: 'premium',
      billing_cycle: 'monthly',
      amount,
      payment_method: paymentMethod,
      transaction_number: transactionNumber.trim(),
      status: 'pending',
    })
    .select('id')
    .single();

  if (error) {
    // Unique constraint violation = duplicate transaction number
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Ce numéro de transaction a déjà été utilisé' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Erreur lors de la soumission' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    paymentRequestId: data.id,
    message: 'Votre demande de paiement a été soumise. Elle sera vérifiée sous 24h.',
  });
}

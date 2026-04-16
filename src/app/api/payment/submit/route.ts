import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase';
import { PAYMENT_METHODS, isValidBillingCycle, getBillingOption } from '@/config/pricing';
import { safeParseJSON } from '@/lib/validation';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import * as Sentry from '@sentry/nextjs';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Rate limit: 5 payment submissions per hour per user
    const rl = await checkRateLimit(`payment-submit:${user.id}`, RATE_LIMITS.paymentSubmit.limit, RATE_LIMITS.paymentSubmit.windowMs);
    if (rl.limited) {
      return NextResponse.json({ error: 'Trop de soumissions. Réessayez plus tard.' }, { status: 429 });
    }

    const body = await safeParseJSON(request);
    if (!body) {
      return NextResponse.json({ error: 'Corps de requête JSON invalide' }, { status: 400 });
    }

    const { tier, billingCycle, paymentMethod, transactionNumber } = body as {
      tier?: string;
      billingCycle?: string;
      paymentMethod?: string;
      transactionNumber?: string;
    };

    // Validate tier
    if (tier !== 'premium') {
      return NextResponse.json({ error: 'Plan invalide' }, { status: 400 });
    }

    // Validate billing cycle
    if (!billingCycle || !isValidBillingCycle(billingCycle)) {
      return NextResponse.json({ error: 'Durée invalide' }, { status: 400 });
    }

    // Validate payment method
    if (!paymentMethod || !(paymentMethod in PAYMENT_METHODS)) {
      return NextResponse.json({ error: 'Méthode de paiement invalide' }, { status: 400 });
    }

    // Validate transaction number
    if (!transactionNumber || typeof transactionNumber !== 'string' || transactionNumber.trim().length < 3) {
      return NextResponse.json({ error: 'Numéro de transaction requis (min 3 caractères)' }, { status: 400 });
    }

    // Get the correct amount: check dynamic pricing first, then fallback to config
    const billingOption = getBillingOption(billingCycle);
    let amount = billingOption.price;
    const serviceClient = createServiceClient();
    if (serviceClient) {
      const { data: dp } = await serviceClient
        .from('dynamic_pricing')
        .select('amount')
        .eq('tier', 'premium')
        .eq('billing_cycle', billingCycle)
        .single();
      if (dp?.amount) amount = dp.amount;
    }

    // Insert payment request
    const { data, error } = await supabase
      .from('payment_requests')
      .insert({
        user_id: user.id,
        tier: 'premium',
        billing_cycle: billingCycle,
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
  } catch (err) {
    Sentry.captureException(err, { tags: { context: 'payment-submit' } });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

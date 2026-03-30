import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase';
import {
  isValidBillingCycle,
  getBillingOption,
  MOBILE_MONEY_METHODS,
  type MobileMoneyProviderId,
  type BillingCycle,
} from '@/config/pricing';
import { getConfiguredProvider } from '@/lib/payment-providers';
import { safeParseJSON } from '@/lib/validation';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

/**
 * POST /api/payment/mobile-money
 *
 * Initiates a mobile money payment via the provider's API.
 * The provider sends a USSD prompt to the user's phone, and the result
 * comes back via webhook (/api/payment/mobile-money/webhook).
 */
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

    // Rate limit: same as manual payment submit
    const rl = await checkRateLimit(
      `payment-mobile-money:${user.id}`,
      RATE_LIMITS.paymentSubmit.limit,
      RATE_LIMITS.paymentSubmit.windowMs,
    );
    if (rl.limited) {
      return NextResponse.json({ error: 'Trop de tentatives. Réessayez plus tard.' }, { status: 429 });
    }

    const body = await safeParseJSON(request);
    if (!body) {
      return NextResponse.json({ error: 'Corps de requête JSON invalide' }, { status: 400 });
    }

    const { billingCycle, providerId, phoneNumber } = body as {
      billingCycle?: string;
      providerId?: string;
      phoneNumber?: string;
    };

    // Validate billing cycle
    if (!billingCycle || !isValidBillingCycle(billingCycle)) {
      return NextResponse.json({ error: 'Durée invalide' }, { status: 400 });
    }

    // Validate provider
    if (!providerId || !(providerId in MOBILE_MONEY_METHODS)) {
      return NextResponse.json({ error: 'Fournisseur de paiement invalide' }, { status: 400 });
    }

    const providerConfig = MOBILE_MONEY_METHODS[providerId as MobileMoneyProviderId];
    if (providerConfig.status !== 'active') {
      return NextResponse.json(
        { error: `${providerConfig.shortName} n'est pas encore disponible.` },
        { status: 400 },
      );
    }

    // Validate phone number
    if (!phoneNumber || typeof phoneNumber !== 'string' || phoneNumber.trim().length < 8) {
      return NextResponse.json({ error: 'Numéro de téléphone invalide' }, { status: 400 });
    }

    // Get amount
    const billingOption = getBillingOption(billingCycle as BillingCycle);
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

    // Create payment request record first
    const { data: paymentRequest, error: insertError } = await supabase
      .from('payment_requests')
      .insert({
        user_id: user.id,
        tier: 'premium',
        billing_cycle: billingCycle,
        amount,
        payment_method: providerId,
        transaction_number: `PENDING_${Date.now()}`,
        status: 'pending',
      })
      .select('id')
      .single();

    if (insertError || !paymentRequest) {
      return NextResponse.json({ error: 'Erreur lors de la création de la demande' }, { status: 500 });
    }

    // Initiate payment with provider
    try {
      const provider = getConfiguredProvider(providerId as MobileMoneyProviderId);
      const result = await provider.initiatePayment({
        paymentRequestId: paymentRequest.id,
        userId: user.id,
        amount,
        phoneNumber: phoneNumber.trim(),
        billingCycle: billingCycle as BillingCycle,
      });

      // Update payment request with provider transaction ID
      if (serviceClient) {
        await serviceClient
          .from('payment_requests')
          .update({
            transaction_number: result.providerTransactionId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', paymentRequest.id);
      }

      return NextResponse.json({
        success: true,
        paymentRequestId: paymentRequest.id,
        providerTransactionId: result.providerTransactionId,
        status: result.status,
        redirectUrl: result.redirectUrl,
        message: result.message || 'Paiement initié. Veuillez confirmer sur votre téléphone.',
      });
    } catch (providerError) {
      // Clean up the payment request if provider initiation fails
      if (serviceClient) {
        await serviceClient
          .from('payment_requests')
          .delete()
          .eq('id', paymentRequest.id);
      }

      const message = providerError instanceof Error
        ? providerError.message
        : 'Erreur lors de l\'initiation du paiement';

      return NextResponse.json({ error: message }, { status: 502 });
    }
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

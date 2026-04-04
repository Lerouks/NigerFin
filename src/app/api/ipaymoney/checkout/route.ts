import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { safeParseJSON } from '@/lib/validation';
import { checkRateLimit } from '@/lib/rate-limit';
import { isValidBillingCycle, getBillingOption } from '@/config/pricing';
import { SITE_URL } from '@/lib/config';
import * as Sentry from '@sentry/nextjs';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const secretKey = process.env.IPAYMONEY_SECRET_KEY;
    const apiUrl = process.env.IPAYMONEY_API_URL;
    if (!secretKey || !apiUrl) {
      return NextResponse.json({ error: 'iPayMoney non configuré' }, { status: 503 });
    }

    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Rate limit: 5 checkout attempts per hour
    const rl = await checkRateLimit(`ipaymoney-checkout:${user.id}`, 5, 60 * 60 * 1000);
    if (rl.limited) {
      return NextResponse.json({ error: 'Trop de tentatives. Réessayez plus tard.' }, { status: 429 });
    }

    const body = await safeParseJSON(request);
    if (!body) {
      return NextResponse.json({ error: 'Corps de requête JSON invalide' }, { status: 400 });
    }

    const { tier, billingCycle } = body as {
      tier?: string;
      billingCycle?: string;
    };

    if (tier !== 'premium') {
      return NextResponse.json({ error: 'Plan invalide' }, { status: 400 });
    }

    if (!billingCycle || !isValidBillingCycle(billingCycle)) {
      return NextResponse.json({ error: 'Durée invalide' }, { status: 400 });
    }

    const billingOption = getBillingOption(billingCycle);
    const amount = billingOption.price;

    // Generate a unique transaction reference
    const transactionRef = `NFI-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

    const siteUrl = SITE_URL;

    // Initiate payment with iPayMoney API
    const paymentPayload = {
      amount,
      currency: 'XOF',
      description: `Abonnement NFI Report Premium - ${billingOption.durationLabel}`,
      transaction_ref: transactionRef,
      return_url: `${siteUrl}/api/ipaymoney/callback?ref=${transactionRef}`,
      cancel_url: `${siteUrl}/pricing?checkout=cancelled`,
      callback_url: `${siteUrl}/api/ipaymoney/callback`,
      customer: {
        email: user.email,
        user_id: user.id,
      },
      metadata: {
        user_id: user.id,
        tier,
        billing_cycle: billingCycle,
      },
    };

    const response = await fetch(`${apiUrl}/payment/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${secretKey}`,
      },
      body: JSON.stringify(paymentPayload),
    });

    const data = await response.json();

    if (!response.ok || !data.payment_url) {
      Sentry.captureMessage('iPayMoney checkout initiation failed', {
        level: 'error',
        extra: { status: response.status, data },
      });
      return NextResponse.json(
        { error: 'Erreur lors de l\'initialisation du paiement iPayMoney.' },
        { status: 502 }
      );
    }

    // Store the pending transaction in payment_requests for tracking
    const { createServiceClient } = await import('@/lib/supabase');
    const serviceClient = createServiceClient();
    if (serviceClient) {
      await serviceClient.from('payment_requests').insert({
        user_id: user.id,
        tier: 'premium',
        billing_cycle: billingCycle,
        amount,
        payment_method: 'ipaymoney',
        transaction_number: transactionRef,
        status: 'pending',
      });
    }

    return NextResponse.json({ url: data.payment_url });
  } catch (err) {
    Sentry.captureException(err, { tags: { context: 'ipaymoney-checkout' } });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

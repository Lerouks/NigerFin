import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { safeParseJSON } from '@/lib/validation';
import { checkRateLimit } from '@/lib/rate-limit';
import { SITE_URL } from '@/lib/config';
import * as Sentry from '@sentry/nextjs';
import crypto from 'crypto';
import Stripe from 'stripe';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured');
  return new Stripe(key, { timeout: 10000 });
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
    }

    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Rate limit: 5 checkout attempts per hour
    const rl = await checkRateLimit(`stripe-checkout:${user.id}`, 5, 60 * 60 * 1000);
    if (rl.limited) {
      return NextResponse.json({ error: 'Trop de tentatives. Réessayez plus tard.' }, { status: 429 });
    }

    const body = await safeParseJSON(request);
    if (!body) {
      return NextResponse.json({ error: 'Corps de requête JSON invalide' }, { status: 400 });
    }

    const { priceId: explicitPriceId, tier, billingCycle } = body as {
      priceId?: string;
      tier?: string;
      billingCycle?: string;
    };

    if (!tier) {
      return NextResponse.json({ error: 'tier required' }, { status: 400 });
    }

    // Resolve priceId: explicit or from billing cycle env vars
    const priceIdMap: Record<string, string | undefined> = {
      monthly: process.env.STRIPE_PRICE_ID_MONTHLY,
      quarterly: process.env.STRIPE_PRICE_ID_QUARTERLY,
      yearly: process.env.STRIPE_PRICE_ID_YEARLY,
    };
    const priceId = explicitPriceId || (billingCycle ? priceIdMap[billingCycle] : undefined);

    if (!priceId) {
      return NextResponse.json({ error: 'Impossible de déterminer le prix. Vérifiez la configuration Stripe.' }, { status: 400 });
    }

    // Validate tier
    if (tier !== 'premium') {
      return NextResponse.json({ error: 'Plan invalide' }, { status: 400 });
    }

    // Validate priceId against allowed Stripe price IDs from environment
    const allowedPriceIds = (process.env.STRIPE_ALLOWED_PRICE_IDS || '').split(',').filter(Boolean);
    if (allowedPriceIds.length > 0 && !allowedPriceIds.includes(priceId)) {
      return NextResponse.json({ error: 'ID de prix invalide' }, { status: 400 });
    }

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    let customerId = profile?.stripe_customer_id;

    const stripe = getStripe();

    if (!customerId) {
      const customerIdempotencyKey = crypto
        .createHash('sha256')
        .update(`create-customer:${user.id}`)
        .digest('hex');
      const customer = await stripe.customers.create(
        {
          email: user.email,
          metadata: {
            supabase_user_id: user.id,
          },
        },
        { idempotencyKey: customerIdempotencyKey }
      );
      customerId = customer.id;
      await supabase
        .from('user_profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    const siteUrl = SITE_URL;

    const checkoutIdempotencyKey = crypto
      .createHash('sha256')
      .update(`checkout:${user.id}:${priceId}:${Date.now()}`)
      .digest('hex');
    const session = await stripe.checkout.sessions.create(
      {
        customer: customerId,
        mode: 'subscription',
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${siteUrl}/compte?checkout=success`,
        cancel_url: `${siteUrl}/pricing?checkout=cancelled`,
        metadata: {
          supabase_user_id: user.id,
          tier,
          billing_cycle: billingCycle || 'monthly',
        },
        subscription_data: {
          metadata: {
            supabase_user_id: user.id,
            tier,
            billing_cycle: billingCycle || 'monthly',
          },
        },
      },
      { idempotencyKey: checkoutIdempotencyKey }
    );

    return NextResponse.json({ url: session.url });
  } catch (err) {
    Sentry.captureException(err, { tags: { context: 'stripe-checkout' } });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

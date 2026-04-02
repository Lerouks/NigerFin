import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase';
import Stripe from 'stripe';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured');
  return new Stripe(key, { timeout: 10000 });
}

// Cancel subscription
export async function DELETE() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const service = createServiceClient();
  if (!service) {
    return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });
  }

  // Check current subscription
  const { data: sub } = await service
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!sub || sub.status !== 'active') {
    return NextResponse.json({ error: 'Aucun abonnement actif' }, { status: 400 });
  }

  if (!sub.stripe_subscription_id) {
    return NextResponse.json({ error: 'Abonnement Stripe introuvable' }, { status: 400 });
  }

  // Sync cancellation with Stripe
  const stripe = getStripe();
  await stripe.subscriptions.update(sub.stripe_subscription_id, {
    cancel_at_period_end: true,
  });

  const now = new Date().toISOString();

  // Mark subscription as cancelled but keep access until period end
  await service
    .from('subscriptions')
    .update({
      cancel_at_period_end: true,
      updated_at: now,
    })
    .eq('user_id', user.id);

  return NextResponse.json({
    success: true,
    message: 'Votre abonnement sera annulé à la fin de la période en cours.',
    period_end: sub.current_period_end,
  });
}

// Reactivate a cancelled subscription (undo cancel_at_period_end)
export async function PATCH() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const service = createServiceClient();
  if (!service) {
    return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });
  }

  const { data: sub } = await service
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!sub) {
    return NextResponse.json({ error: 'Aucun abonnement trouvé' }, { status: 400 });
  }

  // Reactivate: undo cancellation
  if (sub.cancel_at_period_end && sub.status === 'active') {
    if (!sub.stripe_subscription_id) {
      return NextResponse.json({ error: 'Abonnement Stripe introuvable' }, { status: 400 });
    }

    // Sync reactivation with Stripe
    const stripe = getStripe();
    await stripe.subscriptions.update(sub.stripe_subscription_id, {
      cancel_at_period_end: false,
    });

    await service
      .from('subscriptions')
      .update({
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    return NextResponse.json({ success: true, message: 'Abonnement réactivé.' });
  }

  return NextResponse.json({ error: 'Action non disponible' }, { status: 400 });
}

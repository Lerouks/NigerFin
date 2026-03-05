import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase';

// Cancel subscription
export async function DELETE() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
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
    message: 'Votre abonnement sera annule a la fin de la periode en cours.',
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
    return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
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
    return NextResponse.json({ error: 'Aucun abonnement trouve' }, { status: 400 });
  }

  // Reactivate: undo cancellation
  if (sub.cancel_at_period_end && sub.status === 'active') {
    await service
      .from('subscriptions')
      .update({
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    return NextResponse.json({ success: true, message: 'Abonnement reactive.' });
  }

  return NextResponse.json({ error: 'Action non disponible' }, { status: 400 });
}

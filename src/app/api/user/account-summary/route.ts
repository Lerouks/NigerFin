import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  // Fetch subscription, liked articles count, and payment history in parallel
  const [subscriptionRes, likesRes, paymentsRes] = await Promise.all([
    supabase
      .from('subscriptions')
      .select('tier, status, billing_cycle, current_period_start, current_period_end, cancel_at_period_end, price_amount, created_at')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('article_likes')
      .select('article_id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('payment_requests')
      .select('id, amount, tier, billing_cycle, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  return NextResponse.json({
    subscription: subscriptionRes.data || null,
    likedArticlesCount: likesRes.count || 0,
    recentPayments: paymentsRes.data || [],
  });
}

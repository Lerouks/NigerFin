import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ count: 0 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ count: 0 });
  }

  // Count premium articles read this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from('premium_article_tracking')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('read_at', startOfMonth.toISOString());

  return NextResponse.json({ count: count || 0 });
}

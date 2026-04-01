import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ count: 0 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ count: 0 });
  }

  // Count premium articles read this month (UTC for consistency)
  // Only count articles that are STILL premium — if an article was changed
  // from premium to free after reading, it should not count against the limit
  const now = new Date();
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const { data: trackedArticles } = await supabase
    .from('premium_article_tracking')
    .select('article_id')
    .eq('user_id', user.id)
    .gte('read_at', startOfMonth.toISOString());

  const articleIds = Array.from(new Set((trackedArticles || []).map(t => t.article_id)));
  if (articleIds.length === 0) {
    return NextResponse.json({ count: 0 });
  }

  // Use service client to count articles still marked as premium
  const service = createServiceClient();
  if (!service) {
    return NextResponse.json({ count: articleIds.length });
  }

  const { count: stillPremiumCount } = await service
    .from('articles')
    .select('*', { count: 'exact', head: true })
    .in('id', articleIds)
    .eq('content_type', 'premium');

  return NextResponse.json({ count: stillPremiumCount ?? 0 });
}

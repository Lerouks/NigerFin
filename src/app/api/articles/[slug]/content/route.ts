import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const service = createServiceClient();
  if (!service) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }

  const { data: article } = await service
    .from('articles')
    .select('id, content_type, body')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (!article) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Never cache this response, content_type can change at any time
  const noCacheHeaders = {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache',
  };

  // Free articles: return body directly
  if (article.content_type === 'free') {
    return NextResponse.json({ body: bodyToHtml(article.body || ''), contentType: 'free' }, { headers: noCacheHeaders });
  }

  // Premium articles: require auth
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Auth unavailable' }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { data: profile } = await service
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 403 });
  }

  // Admins always have access
  if (profile.role === 'admin') {
    return NextResponse.json({ body: bodyToHtml(article.body || '') }, { headers: noCacheHeaders });
  }

  // Premium users: verify subscription is still active
  if (profile.role === 'premium') {
    const { data: subscription } = await service
      .from('subscriptions')
      .select('current_period_end, status')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .order('current_period_end', { ascending: false })
      .limit(1)
      .single();

    if (subscription && new Date(subscription.current_period_end) > new Date()) {
      return NextResponse.json({ body: bodyToHtml(article.body || '') }, { headers: noCacheHeaders });
    }

    // Subscription expired, downgrade role to reader
    await service
      .from('user_profiles')
      .update({ role: 'reader' })
      .eq('id', user.id);
    // Fall through to monthly free article limit check
  }

  // Get configurable limit from paywall_config
  const { data: config } = await service
    .from('paywall_config')
    .select('free_articles_count')
    .eq('id', 1)
    .single();
  const limit = config?.free_articles_count ?? 3;

  // Count from tracking table for current month, only count articles that are
  // STILL premium (if an article was changed from premium to free, exclude it)
  const startOfMonth = new Date(Date.UTC(
    new Date().getUTCFullYear(),
    new Date().getUTCMonth(),
    1
  ));
  const { data: trackedArticles } = await service
    .from('premium_article_tracking')
    .select('article_id')
    .eq('user_id', user.id)
    .gte('read_at', startOfMonth.toISOString());

  let premiumReadCount = 0;
  const articleIds = Array.from(new Set((trackedArticles || []).map(t => t.article_id)));
  if (articleIds.length > 0) {
    const { count: stillPremiumCount } = await service
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .in('id', articleIds)
      .eq('content_type', 'premium');
    premiumReadCount = stillPremiumCount ?? 0;
  }

  if (premiumReadCount < limit) {
    return NextResponse.json({ body: bodyToHtml(article.body || '') }, { headers: noCacheHeaders });
  }

  return NextResponse.json({ error: 'Premium subscription required' }, { status: 403, headers: noCacheHeaders });
}

function bodyToHtml(raw: string): string {
  if (!raw.trim()) return '';
  if (/<(?:p|div|h[1-6]|ul|ol|blockquote|figure|table|section|article)\b/i.test(raw)) {
    return raw;
  }
  return raw
    .split(/\n{2,}/)
    .filter(block => block.trim())
    .map(block => `<p>${block.trim().replace(/\n/g, '<br>')}</p>`)
    .join('\n');
}

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase';

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

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

  // Free articles: return body directly
  if (article.content_type === 'free') {
    return NextResponse.json({ body: bodyToHtml(article.body || '') });
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

  if (profile.role === 'admin' || profile.role === 'premium') {
    return NextResponse.json({ body: bodyToHtml(article.body || '') });
  }

  // Get configurable limit from paywall_config
  const { data: config } = await service
    .from('paywall_config')
    .select('free_articles_count')
    .eq('id', 1)
    .single();
  const limit = config?.free_articles_count ?? 3;

  // Count from tracking table (dedup'd source of truth) for current month
  const startOfMonth = new Date(Date.UTC(
    new Date().getUTCFullYear(),
    new Date().getUTCMonth(),
    1
  ));
  const { count } = await service
    .from('premium_article_tracking')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('read_at', startOfMonth.toISOString());

  if ((count ?? 0) < limit) {
    return NextResponse.json({ body: bodyToHtml(article.body || '') });
  }

  return NextResponse.json({ error: 'Premium subscription required' }, { status: 403 });
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

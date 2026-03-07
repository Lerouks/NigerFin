import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase';

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  // Fetch article metadata to check content_type
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

  // Free articles: return body without auth check
  if (article.content_type === 'free') {
    return NextResponse.json({ body: bodyToHtml(article.body || '') });
  }

  // Premium articles: require authentication + access check
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Auth unavailable' }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  // Fetch user profile to check role
  const { data: profile } = await service
    .from('user_profiles')
    .select('role, premium_articles_read_this_month')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 403 });
  }

  // Admin and premium users always have access
  if (profile.role === 'admin' || profile.role === 'premium') {
    return NextResponse.json({ body: bodyToHtml(article.body || '') });
  }

  // Reader: check monthly limit (3 premium articles)
  if (profile.premium_articles_read_this_month < 3) {
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

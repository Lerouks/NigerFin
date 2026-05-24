import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase';
import { sanitizeHtml } from '@/lib/sanitize-html';

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
    // Check user_profiles.subscription_end first (canonical source)
    const { data: profileFull } = await service
      .from('user_profiles')
      .select('subscription_end, subscription_status')
      .eq('id', user.id)
      .single();

    const subEnd = profileFull?.subscription_end;
    const isActive = profileFull?.subscription_status === 'active' && subEnd && new Date(subEnd) > new Date();

    if (isActive) {
      return NextResponse.json({ body: bodyToHtml(article.body || '') }, { headers: noCacheHeaders });
    }

    // Subscription expired or missing - do NOT downgrade here (cron handles that)
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

// Sec H-1 : defense-en-profondeur. Meme si l'editeur admin (TipTap) sanitize
// l'input, on re-passe le body au moment du serve. Couvre les cas :
//   - articles ecrits avant l'introduction du sanitize cote ecriture
//   - compromission d'un compte admin qui ecrirait du HTML brut via SQL
//   - bug futur dans le pipeline editeur
function bodyToHtml(raw: string): string {
  if (!raw.trim()) return '';
  let html: string;
  if (/<(?:p|div|h[1-6]|ul|ol|blockquote|figure|table|section|article)\b/i.test(raw)) {
    html = raw;
  } else {
    html = raw
      .split(/\n{2,}/)
      .filter(block => block.trim())
      .map(block => `<p>${block.trim().replace(/\n/g, '<br>')}</p>`)
      .join('\n');
  }
  return sanitizeHtml(html);
}

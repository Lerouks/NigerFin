import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { articleId, articleSlug } = await request.json();
  if (!articleId || !articleSlug) {
    return NextResponse.json({ error: 'articleId and articleSlug required' }, { status: 400 });
  }

  // Verify article is actually premium before tracking
  const service = createServiceClient();
  if (service) {
    const { data: article } = await service
      .from('articles')
      .select('content_type')
      .eq('id', articleId)
      .single();
    if (article?.content_type !== 'premium') {
      return NextResponse.json({ success: true, skipped: true });
    }
  }

  // Insert tracking record (upsert to avoid duplicates)
  const { error: trackError } = await supabase
    .from('premium_article_tracking')
    .upsert(
      {
        user_id: user.id,
        article_id: articleId,
        article_slug: articleSlug,
        read_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,article_id' }
    );

  if (trackError) {
    return NextResponse.json({ error: trackError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

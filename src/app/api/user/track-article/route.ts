import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

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

  // Count is always derived from premium_article_tracking table (dedup'd).
  // No separate counter increment needed — eliminates double-count bugs.

  return NextResponse.json({ success: true });
}

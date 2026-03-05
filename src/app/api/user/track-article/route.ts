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

  // Increment the monthly counter on user_profiles
  try {
    await supabase.rpc('increment_premium_count', {
      p_user_id: user.id,
    });
  } catch {
    // Fallback: manual increment
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('premium_articles_read_this_month')
      .eq('id', user.id)
      .single();

    if (profile) {
      await supabase
        .from('user_profiles')
        .update({
          premium_articles_read_this_month: (profile.premium_articles_read_this_month || 0) + 1,
        })
        .eq('id', user.id);
    }
  }

  return NextResponse.json({ success: true });
}

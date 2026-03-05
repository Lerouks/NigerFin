import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const articleId = request.nextUrl.searchParams.get('article_id');
  if (!articleId) {
    return NextResponse.json({ error: 'article_id required' }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ count: 0, isLiked: false });
  }

  const { count } = await supabase
    .from('article_likes')
    .select('*', { count: 'exact', head: true })
    .eq('article_id', articleId);

  const { data: { user } } = await supabase.auth.getUser();
  let isLiked = false;
  if (user) {
    const { data } = await supabase
      .from('article_likes')
      .select('id')
      .eq('article_id', articleId)
      .eq('user_id', user.id)
      .maybeSingle();
    isLiked = !!data;
  }

  return NextResponse.json({ count: count || 0, isLiked });
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const { article_id } = await request.json();
  if (!article_id) {
    return NextResponse.json({ error: 'article_id required' }, { status: 400 });
  }

  // Check if already liked
  const { data: existing } = await supabase
    .from('article_likes')
    .select('id')
    .eq('article_id', article_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    // Unlike
    await supabase.from('article_likes').delete().eq('id', existing.id);
    return NextResponse.json({ liked: false });
  } else {
    // Like
    await supabase.from('article_likes').insert({ article_id, user_id: user.id });
    return NextResponse.json({ liked: true });
  }
}

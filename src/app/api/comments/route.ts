import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { serverError } from '@/lib/api-error';

export async function GET(request: NextRequest) {
  const articleId = request.nextUrl.searchParams.get('article_id');
  if (!articleId) {
    return NextResponse.json({ error: 'article_id required' }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json([]);
  }

  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('article_id', articleId)
    .order('created_at', { ascending: false });

  if (error) {
    return serverError(error, 'comments');
  }

  return NextResponse.json(data || []);
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

  const body = await request.json();
  const { article_id, content, parent_comment_id } = body;

  if (!article_id || !content?.trim()) {
    return NextResponse.json({ error: 'article_id and content required' }, { status: 400 });
  }

  if (content.trim().length > 5000) {
    return NextResponse.json({ error: 'Commentaire trop long (max 5000 caractères)' }, { status: 400 });
  }

  const username = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Utilisateur';

  const { data, error } = await supabase
    .from('comments')
    .insert({
      article_id,
      user_id: user.id,
      user_name: username,
      content: content.trim(),
      parent_comment_id: parent_comment_id || null,
    })
    .select()
    .single();

  if (error) {
    return serverError(error, 'comments');
  }

  return NextResponse.json(data, { status: 201 });
}

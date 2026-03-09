import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { serverError } from '@/lib/api-error';

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get('category');

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json([]);
  }

  let query = supabase
    .from('discussions')
    .select('*, discussion_comments(count)')
    .order('created_at', { ascending: false });

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;

  if (error) {
    return serverError(error, 'discussions');
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
  const { title, content, category } = body;

  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: 'title and content required' }, { status: 400 });
  }

  if (title.trim().length > 200) {
    return NextResponse.json({ error: 'Titre trop long (max 200 caractères)' }, { status: 400 });
  }

  if (content.trim().length > 10000) {
    return NextResponse.json({ error: 'Contenu trop long (max 10000 caractères)' }, { status: 400 });
  }

  const username = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Utilisateur';

  const { data, error } = await supabase
    .from('discussions')
    .insert({
      title: title.trim(),
      content: content.trim(),
      user_id: user.id,
      username,
      category: category || 'general',
    })
    .select()
    .single();

  if (error) {
    return serverError(error, 'discussions');
  }

  return NextResponse.json(data, { status: 201 });
}

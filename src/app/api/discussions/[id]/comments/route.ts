import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json([]);
  }

  const { data, error } = await supabase
    .from('discussion_comments')
    .select('*')
    .eq('discussion_id', params.id)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const body = await request.json();
  const { content, parent_comment_id } = body;

  if (!content?.trim()) {
    return NextResponse.json({ error: 'content required' }, { status: 400 });
  }

  const username = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Utilisateur';

  const { data, error } = await supabase
    .from('discussion_comments')
    .insert({
      discussion_id: params.id,
      user_id: user.id,
      username,
      content: content.trim(),
      parent_comment_id: parent_comment_id || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

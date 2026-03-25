import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { serverError } from '@/lib/api-error';
import { parsePagination, paginatedResponse } from '@/lib/pagination';
import { isValidUUID, safeParseJSON } from '@/lib/validation';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!isValidUUID(id)) {
    return NextResponse.json({ error: 'ID de discussion invalide (UUID requis)' }, { status: 400 });
  }

  const pagination = parsePagination(request.nextUrl.searchParams);

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json(paginatedResponse([], 0, pagination));
  }

  const { count } = await supabase
    .from('discussion_comments')
    .select('*', { count: 'exact', head: true })
    .eq('discussion_id', id);

  const { data, error } = await supabase
    .from('discussion_comments')
    .select('*')
    .eq('discussion_id', id)
    .order('created_at', { ascending: true })
    .range(pagination.offset, pagination.offset + pagination.limit - 1);

  if (error) {
    return serverError(error, 'discussion-comments');
  }

  return NextResponse.json(paginatedResponse(data || [], count || 0, pagination));
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'ID de discussion invalide (UUID requis)' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Rate limit: 10 comments per minute per user
    const rl = await checkRateLimit(`disc-comments:${user.id}`, RATE_LIMITS.comments.limit, RATE_LIMITS.comments.windowMs);
    if (rl.limited) {
      return NextResponse.json({ error: 'Trop de commentaires. Réessayez plus tard.' }, { status: 429 });
    }

    const body = await safeParseJSON(request);
    if (!body) {
      return NextResponse.json({ error: 'Corps de requête JSON invalide' }, { status: 400 });
    }

    const { content, parent_comment_id } = body as { content?: string; parent_comment_id?: string };

    if (!content?.trim()) {
      return NextResponse.json({ error: 'content required' }, { status: 400 });
    }

    if (content.trim().length > 5000) {
      return NextResponse.json({ error: 'Commentaire trop long (max 5000 caractères)' }, { status: 400 });
    }

    if (parent_comment_id && !isValidUUID(parent_comment_id)) {
      return NextResponse.json({ error: 'parent_comment_id invalide (UUID requis)' }, { status: 400 });
    }

    const username = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Utilisateur';

    const { data, error } = await supabase
      .from('discussion_comments')
      .insert({
        discussion_id: id,
        user_id: user.id,
        username,
        content: content.trim(),
        parent_comment_id: parent_comment_id || null,
      })
      .select()
      .single();

    if (error) {
      return serverError(error, 'discussion-comments');
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

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
    .select('id, discussion_id, user_id, username, content, parent_comment_id, created_at')
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

    // Validate parent comment exists and belongs to the same discussion
    if (parent_comment_id) {
      const { data: parentComment } = await supabase
        .from('discussion_comments')
        .select('id, discussion_id')
        .eq('id', parent_comment_id)
        .single();

      if (!parentComment) {
        return NextResponse.json({ error: 'Commentaire parent introuvable' }, { status: 404 });
      }
      if (parentComment.discussion_id !== id) {
        return NextResponse.json({ error: 'Le commentaire parent n\'appartient pas à cette discussion' }, { status: 400 });
      }
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

export async function DELETE(
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

    const commentId = request.nextUrl.searchParams.get('comment_id');
    if (!commentId || !isValidUUID(commentId)) {
      return NextResponse.json({ error: 'comment_id invalide (UUID requis)' }, { status: 400 });
    }

    // Fetch the comment to verify ownership and discussion membership
    const { data: comment, error: fetchError } = await supabase
      .from('discussion_comments')
      .select('id, user_id, discussion_id')
      .eq('id', commentId)
      .single();

    if (fetchError || !comment) {
      return NextResponse.json({ error: 'Commentaire introuvable' }, { status: 404 });
    }

    if (comment.discussion_id !== id) {
      return NextResponse.json({ error: 'Commentaire n\'appartient pas à cette discussion' }, { status: 400 });
    }

    // Allow deletion by author or admin
    const isAuthor = comment.user_id === user.id;
    if (!isAuthor) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
      }
    }

    const { error } = await supabase
      .from('discussion_comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      return serverError(error, 'discussion-comments');
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

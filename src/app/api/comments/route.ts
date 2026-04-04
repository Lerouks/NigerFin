import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { serverError } from '@/lib/api-error';
import { parsePagination, paginatedResponse } from '@/lib/pagination';
import { isValidUUID, safeParseJSON } from '@/lib/validation';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  const articleId = request.nextUrl.searchParams.get('article_id');
  if (!articleId || !isValidUUID(articleId)) {
    return NextResponse.json({ error: 'article_id invalide (UUID requis)' }, { status: 400 });
  }

  const params = parsePagination(request.nextUrl.searchParams);

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json(paginatedResponse([], 0, params));
  }

  const { count } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('article_id', articleId);

  const { data, error } = await supabase
    .from('comments')
    .select('id, article_id, user_id, user_name, content, parent_comment_id, created_at')
    .eq('article_id', articleId)
    .order('created_at', { ascending: true })
    .range(params.offset, params.offset + params.limit - 1);

  if (error) {
    return serverError(error, 'comments');
  }

  return NextResponse.json(paginatedResponse(data || [], count || 0, params));
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Rate limit: 10 comments per minute per user
    const rl = await checkRateLimit(`comments:${user.id}`, RATE_LIMITS.comments.limit, RATE_LIMITS.comments.windowMs);
    if (rl.limited) {
      return NextResponse.json({ error: 'Trop de commentaires. Réessayez plus tard.' }, { status: 429 });
    }

    const body = await safeParseJSON(request);
    if (!body) {
      return NextResponse.json({ error: 'Corps de requête JSON invalide' }, { status: 400 });
    }

    const { article_id, content, parent_comment_id } = body as {
      article_id?: string;
      content?: string;
      parent_comment_id?: string;
    };

    if (!article_id || !isValidUUID(article_id)) {
      return NextResponse.json({ error: 'article_id invalide (UUID requis)' }, { status: 400 });
    }

    if (!content?.trim()) {
      return NextResponse.json({ error: 'content required' }, { status: 400 });
    }

    if (content.trim().length > 5000) {
      return NextResponse.json({ error: 'Commentaire trop long (max 5000 caractères)' }, { status: 400 });
    }

    if (parent_comment_id && !isValidUUID(parent_comment_id)) {
      return NextResponse.json({ error: 'parent_comment_id invalide (UUID requis)' }, { status: 400 });
    }

    // Validate parent comment exists and belongs to the same article
    if (parent_comment_id) {
      const { data: parentComment } = await supabase
        .from('comments')
        .select('id, article_id')
        .eq('id', parent_comment_id)
        .single();

      if (!parentComment) {
        return NextResponse.json({ error: 'Commentaire parent introuvable' }, { status: 404 });
      }
      if (parentComment.article_id !== article_id) {
        return NextResponse.json({ error: 'Le commentaire parent n\'appartient pas à cet article' }, { status: 400 });
      }
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
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const commentId = request.nextUrl.searchParams.get('id');
    if (!commentId || !isValidUUID(commentId)) {
      return NextResponse.json({ error: 'id invalide (UUID requis)' }, { status: 400 });
    }

    // Fetch the comment to verify ownership
    const { data: comment, error: fetchError } = await supabase
      .from('comments')
      .select('id, user_id')
      .eq('id', commentId)
      .single();

    if (fetchError || !comment) {
      return NextResponse.json({ error: 'Commentaire introuvable' }, { status: 404 });
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
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      return serverError(error, 'comments');
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

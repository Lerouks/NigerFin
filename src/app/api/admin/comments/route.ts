import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { serverError } from '@/lib/api-error';
import { isValidUUID } from '@/lib/validation';
import { logAuditEvent } from '@/lib/audit';

// GET: list all comments with article title, paginated
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const { serviceClient } = auth;
  const url = request.nextUrl;
  const articleId = url.searchParams.get('article_id');
  const countOnly = url.searchParams.get('count_only');
  const page = parseInt(url.searchParams.get('page') || '1') || 1;
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50') || 50, 100);
  const offset = (page - 1) * limit;

  // Count only (for badge)
  if (countOnly) {
    const { count } = await serviceClient
      .from('comments')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({ total: count || 0 });
  }

  // Build query
  let query = serviceClient
    .from('comments')
    .select('id, article_id, user_id, user_name, content, parent_comment_id, created_at', { count: 'exact', head: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (articleId && isValidUUID(articleId)) {
    query = query.eq('article_id', articleId);
  }

  const { data: comments, count, error } = await query;
  if (error) return serverError(error, 'admin-comments');

  // Fetch article titles for the comments
  const articleIds = [...new Set((comments || []).map((c) => c.article_id).filter(Boolean))];
  let articleMap: Record<string, string> = {};

  if (articleIds.length > 0) {
    const { data: articles } = await serviceClient
      .from('articles')
      .select('id, title')
      .in('id', articleIds);

    if (articles) {
      articleMap = Object.fromEntries(articles.map((a) => [a.id, a.title]));
    }
  }

  const enriched = (comments || []).map((c) => ({
    ...c,
    article_title: articleMap[c.article_id] || 'Article supprimé',
  }));

  return NextResponse.json({
    data: enriched,
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  });
}

// DELETE: admin delete a comment
export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const { user, serviceClient } = auth;
  const commentId = request.nextUrl.searchParams.get('id');

  if (!commentId || !isValidUUID(commentId)) {
    return NextResponse.json({ error: 'id invalide (UUID requis)' }, { status: 400 });
  }

  // Fetch comment before deleting for audit
  const { data: comment } = await serviceClient
    .from('comments')
    .select('id, user_name, content, article_id')
    .eq('id', commentId)
    .single();

  if (!comment) {
    return NextResponse.json({ error: 'Commentaire introuvable' }, { status: 404 });
  }

  // Delete replies first (cascade)
  await serviceClient
    .from('comments')
    .delete()
    .eq('parent_comment_id', commentId);

  // Delete the comment
  const { error } = await serviceClient
    .from('comments')
    .delete()
    .eq('id', commentId);

  if (error) return serverError(error, 'admin-comments');

  await logAuditEvent(user.id, 'delete_comment', 'comment', commentId, {
    userName: comment.user_name,
    content: comment.content.substring(0, 100),
    articleId: comment.article_id,
  });

  return NextResponse.json({ success: true });
}

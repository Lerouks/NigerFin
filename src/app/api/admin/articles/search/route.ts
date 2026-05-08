import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { serverError } from '@/lib/api-error';
import { SITE_URL } from '@/lib/config';

/**
 * GET /api/admin/articles/search?q=...
 * Lightweight autocomplete for inserting article links into the newsletter editor.
 * Admin only.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;
    const { serviceClient } = auth;

    const q = (req.nextUrl.searchParams.get('q') ?? '').trim().slice(0, 100);
    if (q.length < 2) {
      return NextResponse.json({ articles: [] });
    }

    const pattern = `%${q.replace(/[%_\\]/g, '\\$&')}%`;
    const { data, error } = await serviceClient
      .from('articles')
      .select('id, slug, title, content_type, published_at')
      .or(`title.ilike.${pattern},slug.ilike.${pattern}`)
      .eq('status', 'published')
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(10);

    if (error) {
      return NextResponse.json({ articles: [] });
    }

    interface ArticleRow {
      id: string;
      slug: string;
      title: string;
      content_type: string | null;
      published_at: string | null;
    }
    const articles = (data ?? []).map((a: ArticleRow) => ({
      id: a.id,
      slug: a.slug,
      title: a.title,
      url: `${SITE_URL}/articles/${a.slug}`,
      contentType: a.content_type,
      publishedAt: a.published_at,
    }));

    return NextResponse.json({ articles });
  } catch (err) {
    return serverError(err, 'admin-articles-search');
  }
}

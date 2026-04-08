import { createServiceClient } from '@/lib/supabase';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SupabaseArticle {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  excerpt: string | null;
  category: string;
  sections: string[];
  content_type: 'free' | 'premium';
  is_featured: boolean;
  featured_order: number;
  author_name: string;
  author_avatar: string | null;
  main_image_url: string | null;
  main_image_alt: string | null;
  main_image_caption: string | null;
  main_image_source: string | null;
  body: string;
  read_time: number | null;
  tags: string[];
  seo_title: string | null;
  seo_description: string | null;
  status: 'draft' | 'published' | 'archived';
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Adapter: convert Supabase article to frontend Article type ─────────────

import type { Article } from '@/types';

export function toArticle(row: SupabaseArticle): Article {
  return {
    _id: row.id,
    slug: { current: row.slug },
    title: row.title,
    subtitle: row.subtitle || undefined,
    excerpt: row.excerpt || '',
    category: row.category,
    sections: row.sections || [row.category],
    author: {
      name: row.author_name,
      avatar: row.author_avatar,
    },
    publishedAt: row.published_at || row.created_at,
    mainImage: row.main_image_url ? { url: row.main_image_url, alt: row.main_image_alt, caption: row.main_image_caption, source: row.main_image_source } : null,
    body: row.body ? [{ _type: 'block', children: [{ _type: 'span', text: '' }] }] : [],
    isPremium: row.content_type !== 'free',
    contentType: row.content_type,
    readTime: row.read_time || 3,
    tags: row.tags || [],
    seo: {
      metaTitle: row.seo_title || undefined,
      metaDescription: row.seo_description || undefined,
    },
  };
}

// ─── Body processing ────────────────────────────────────────────────────────

/**
 * Convert raw body text to HTML paragraphs.
 * If the body already contains block-level HTML tags, return as-is.
 * Otherwise, split on blank lines into <p> and convert single newlines to <br>.
 */
function bodyToHtml(raw: string): string {
  if (!raw.trim()) return '';
  // If body already contains block-level HTML, assume it's already formatted
  if (/<(?:p|div|h[1-6]|ul|ol|blockquote|figure|table|section|article)\b/i.test(raw)) {
    return raw;
  }
  // Split on double newlines (paragraph breaks), then convert single newlines to <br>
  return raw
    .split(/\n{2,}/)
    .filter(block => block.trim())
    .map(block => `<p>${block.trim().replace(/\n/g, '<br>')}</p>`)
    .join('\n');
}

// ─── Data fetching functions ────────────────────────────────────────────────

/** Get paginated published articles */
export async function getAllArticles(page = 1, limit = 20): Promise<{ articles: Article[]; total: number }> {
  const supabase = createServiceClient();
  if (!supabase) return { articles: [], total: 0 };

  const offset = (page - 1) * limit;

  const { count } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published');

  const { data } = await supabase
    .from('articles')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1);

  return {
    articles: (data || []).map(toArticle),
    total: count || 0,
  };
}

export async function getArticleBySlug(slug: string): Promise<{ article: Article; htmlBody: string } | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();
  if (!data) return null;
  return { article: toArticle(data), htmlBody: bodyToHtml(data.body || '') };
}

export async function getArticlesByCategory(category: string, page = 1, limit = 20): Promise<{ articles: Article[]; total: number }> {
  const supabase = createServiceClient();
  if (!supabase) return { articles: [], total: 0 };

  const offset = (page - 1) * limit;

  const { count } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')
    .contains('sections', [category]);

  const { data } = await supabase
    .from('articles')
    .select('*')
    .eq('status', 'published')
    .contains('sections', [category])
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1);

  return {
    articles: (data || []).map(toArticle),
    total: count || 0,
  };
}

export async function getFeaturedArticles(): Promise<Article[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from('articles')
    .select('*')
    .eq('status', 'published')
    .eq('is_featured', true)
    .order('featured_order', { ascending: true })
    .limit(5);
  return (data || []).map(toArticle);
}

export async function getRelatedArticles(currentSlug: string, category: string, _tags: string[]): Promise<Article[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from('articles')
    .select('*')
    .eq('status', 'published')
    .contains('sections', [category])
    .neq('slug', currentSlug)
    .order('published_at', { ascending: false })
    .limit(3);
  return (data || []).map(toArticle);
}

/** Search published articles by query string (title, excerpt, category, tags) */
export async function searchArticles(query: string, limit = 20): Promise<Article[]> {
  const supabase = createServiceClient();
  if (!supabase || !query.trim()) return [];

  // Sanitize query to escape SQL wildcards (%, _) and backslashes
  const q = query.trim().toLowerCase()
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
    .slice(0, 200);

  // Use Supabase ilike for flexible partial matching across key fields
  const { data } = await supabase
    .from('articles')
    .select('*')
    .eq('status', 'published')
    .or(`title.ilike.%${q}%,excerpt.ilike.%${q}%,category.ilike.%${q}%,author_name.ilike.%${q}%`)
    .order('published_at', { ascending: false })
    .limit(limit);

  return (data || []).map(toArticle);
}

/** Get the latest N articles for each section in parallel (homepage) */
export async function getLatestBySection(
  sections: string[],
  limit = 4,
): Promise<Record<string, Article[]>> {
  const supabase = createServiceClient();
  if (!supabase) return Object.fromEntries(sections.map((s) => [s, []]));

  const results = await Promise.all(
    sections.map(async (section) => {
      const { data } = await supabase
        .from('articles')
        .select('*')
        .eq('status', 'published')
        .contains('sections', [section])
        .order('published_at', { ascending: false })
        .limit(limit);
      return [section, (data || []).map(toArticle)] as const;
    }),
  );

  return Object.fromEntries(results);
}

/** Get article IDs ranked by view count (most viewed first). Used for "most read" filter. */
export async function getArticleViewRanking(): Promise<string[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  // Count views per article_id from page_views, ordered by count desc
  const { data } = await supabase
    .rpc('get_article_view_ranking');

  // Fallback: if the RPC doesn't exist, query directly
  if (!data) {
    const { data: views } = await supabase
      .from('page_views')
      .select('article_id')
      .not('article_id', 'is', null);

    if (!views) return [];

    // Count views per article manually
    const counts = new Map<string, number>();
    for (const v of views) {
      if (v.article_id) {
        counts.set(v.article_id, (counts.get(v.article_id) || 0) + 1);
      }
    }

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id);
  }

  return (data as { article_id: string }[]).map((r) => r.article_id);
}

export async function getAllArticleSlugs(): Promise<string[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from('articles')
    .select('slug')
    .eq('status', 'published');
  return (data || []).map((row: { slug: string }) => row.slug);
}

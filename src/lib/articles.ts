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

function toArticle(row: SupabaseArticle): Article {
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

/**
 * Get exactly 3 related articles using a multi-level priority algorithm:
 * 1. Same section + shared tags (sorted by tag overlap desc, then date desc)
 * 2. Same section, most recent
 * 3. Shared tags any section, most recent
 * 4. Fallback: latest articles
 */
export async function getRelatedArticles(currentSlug: string, category: string, tags: string[]): Promise<Article[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];
  const TARGET = 3;

  // Fetch candidates: same section OR overlapping tags, max 20
  const { data: candidates } = await supabase
    .from('articles')
    .select('*')
    .eq('status', 'published')
    .neq('slug', currentSlug)
    .or(`sections.cs.{${category}}${tags.length > 0 ? `,tags.ov.{${tags.join(',')}}` : ''}`)
    .order('published_at', { ascending: false })
    .limit(20);

  const pool = (candidates || []).map(toArticle);
  const result: Article[] = [];
  const usedIds = new Set<string>();

  const add = (article: Article) => {
    if (usedIds.has(article._id) || result.length >= TARGET) return;
    usedIds.add(article._id);
    result.push(article);
  };

  // Level 1: same section + shared tags, sorted by tag overlap
  if (tags.length > 0) {
    const level1 = pool
      .filter((a) => a.sections.includes(category) && a.tags.some((t) => tags.includes(t)))
      .sort((a, b) => {
        const overlapA = a.tags.filter((t) => tags.includes(t)).length;
        const overlapB = b.tags.filter((t) => tags.includes(t)).length;
        if (overlapB !== overlapA) return overlapB - overlapA;
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      });
    for (const a of level1) add(a);
  }

  // Level 2: same section, most recent
  if (result.length < TARGET) {
    const level2 = pool.filter((a) => a.sections.includes(category));
    for (const a of level2) add(a);
  }

  // Level 3: shared tags any section
  if (result.length < TARGET && tags.length > 0) {
    const level3 = pool.filter((a) => a.tags.some((t) => tags.includes(t)));
    for (const a of level3) add(a);
  }

  // Level 4: fallback - any remaining from pool
  if (result.length < TARGET) {
    for (const a of pool) add(a);
  }

  // Level 5: if still not enough (very few articles), fetch latest
  if (result.length < TARGET) {
    const { data: latest } = await supabase
      .from('articles')
      .select('*')
      .eq('status', 'published')
      .neq('slug', currentSlug)
      .order('published_at', { ascending: false })
      .limit(TARGET);
    for (const row of (latest || [])) {
      add(toArticle(row));
    }
  }

  return result.slice(0, TARGET);
}

/** Search published articles by query string (title, excerpt, category, tags) */
export async function searchArticles(query: string, limit = 20): Promise<Article[]> {
  const supabase = createServiceClient();
  if (!supabase || !query.trim()) return [];

  // C-2 fix : whitelist stricte des caractères pour éviter l'injection PostgREST.
  // L'ancien sanitizer échappait %, _, \ mais pas les séparateurs PostgREST (, ( ) :)
  // qui permettaient de casser l'expression .or() en injectant des opérateurs.
  // On garde uniquement : lettres latines (avec accents français), chiffres, espaces, tirets.
  const q = query.trim().toLowerCase()
    .normalize('NFC')
    .replace(/[^a-zàâäéèêëîïôöùûüÿñç0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100);

  if (!q) return [];

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

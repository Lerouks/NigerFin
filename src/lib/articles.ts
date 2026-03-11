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
    mainImage: row.main_image_url ? { url: row.main_image_url, alt: row.main_image_alt, caption: row.main_image_caption } : null,
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

export async function getAllArticles(): Promise<Article[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from('articles')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false });
  return (data || []).map(toArticle);
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

export async function getArticlesByCategory(category: string): Promise<Article[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from('articles')
    .select('*')
    .eq('status', 'published')
    .contains('sections', [category])
    .order('published_at', { ascending: false });
  return (data || []).map(toArticle);
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

export async function getRelatedArticles(currentSlug: string, category: string, tags: string[]): Promise<Article[]> {
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

export async function getAllArticleSlugs(): Promise<string[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from('articles')
    .select('slug')
    .eq('status', 'published');
  return (data || []).map((row: { slug: string }) => row.slug);
}

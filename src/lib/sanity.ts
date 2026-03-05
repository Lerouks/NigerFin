import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';
import type { Article } from '@/types';

export const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
});

// Preview client (no CDN, with token for draft content)
export const previewClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});

export function getClient(preview = false) {
  return preview ? previewClient : sanityClient;
}

const builder = imageUrlBuilder(sanityClient);

export function urlFor(source: any) {
  if (!source) return null;
  return builder.image(source);
}

// Check if Sanity is configured
export const isSanityConfigured = !!(process.env.NEXT_PUBLIC_SANITY_PROJECT_ID);

// ─── GROQ Queries ───────────────────────────────────────────────────────────

const articleFields = `
  _id,
  title,
  subtitle,
  slug,
  excerpt,
  category,
  author->{name, avatar},
  publishedAt,
  mainImage,
  body,
  isPremium,
  readTime,
  tags,
  "shareImage": mainImage
`;

export const articlesQuery = `*[_type == "article"] | order(publishedAt desc) {
  ${articleFields}
}`;

export const articleBySlugQuery = `*[_type == "article" && slug.current == $slug][0] {
  ${articleFields}
}`;

export const articlesByCategoryQuery = `*[_type == "article" && category == $category] | order(publishedAt desc) {
  ${articleFields}
}`;

export const latestArticlesQuery = `*[_type == "article"] | order(publishedAt desc) [0...$limit] {
  ${articleFields}
}`;

export const relatedArticlesQuery = `*[_type == "article" && slug.current != $currentSlug && (category == $category || count((tags[])[@ in $tags]) > 0)] | order(publishedAt desc) [0...3] {
  ${articleFields}
}`;

export const articleSlugsQuery = `*[_type == "article" && defined(slug.current)][].slug.current`;

export const pageBySlugQuery = `*[_type == "page" && slug.current == $slug][0] {
  _id,
  title,
  body,
  seo
}`;

// ─── Data Fetching Functions ────────────────────────────────────────────────

export async function getAllArticles(preview = false): Promise<Article[]> {
  if (!isSanityConfigured) return [];
  return getClient(preview).fetch(articlesQuery);
}

export async function getArticleBySlug(slug: string, preview = false): Promise<Article | null> {
  if (!isSanityConfigured) return null;
  return getClient(preview).fetch(articleBySlugQuery, { slug });
}

export async function getArticlesByCategory(category: string, preview = false): Promise<Article[]> {
  if (!isSanityConfigured) return [];
  return getClient(preview).fetch(articlesByCategoryQuery, { category });
}

export async function getLatestArticles(limit = 10, preview = false): Promise<Article[]> {
  if (!isSanityConfigured) return [];
  return getClient(preview).fetch(latestArticlesQuery, { limit });
}

export async function getRelatedArticles(currentSlug: string, category: string, tags: string[], preview = false): Promise<Article[]> {
  if (!isSanityConfigured) return [];
  return getClient(preview).fetch(relatedArticlesQuery, { currentSlug, category, tags });
}

export async function getAllArticleSlugs(): Promise<string[]> {
  if (!isSanityConfigured) return [];
  return sanityClient.fetch(articleSlugsQuery);
}

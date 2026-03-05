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

// ─── Article GROQ Queries ───────────────────────────────────────────────────

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

// ─── Site Settings Queries ──────────────────────────────────────────────────

export const siteSettingsQuery = `*[_type == "siteSettings"][0] {
  siteName,
  siteDescription,
  contactEmail,
  socialLinks {
    facebook,
    twitter,
    linkedin,
    instagram,
    youtube,
    tiktok
  },
  navigation[] {
    label,
    path,
    order
  },
  footerSections[] {
    title,
    links[] {
      label,
      path
    }
  }
}`;

export const breakingNewsQuery = `*[_type == "breakingNews" && active == true] | order(_createdAt desc) [0...10] {
  _id,
  tag,
  text
}`;

export const toolsQuery = `*[_type == "tool"] | order(order asc) {
  _id,
  name,
  slug,
  icon,
  isPremium,
  description
}`;

export const legalPageQuery = `*[_type == "legalPage" && slug.current == $slug][0] {
  _id,
  title,
  slug,
  sections[] {
    heading,
    text
  },
  lastUpdated
}`;

// ─── Article Data Fetching ──────────────────────────────────────────────────

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

// ─── Site Content Data Fetching ─────────────────────────────────────────────

export interface SiteSettings {
  siteName?: string;
  siteDescription?: string;
  contactEmail?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    youtube?: string;
    tiktok?: string;
  };
  navigation?: Array<{ label: string; path: string; order: number }>;
  footerSections?: Array<{
    title: string;
    links: Array<{ label: string; path: string }>;
  }>;
}

export interface BreakingNewsItem {
  _id: string;
  tag: string;
  text: string;
}

export interface ToolItem {
  _id: string;
  name: string;
  slug: { current: string } | string;
  icon?: string;
  isPremium?: boolean;
  description?: string;
}

export interface LegalPage {
  _id: string;
  title: string;
  slug: { current: string };
  sections: Array<{ heading: string; text: string }>;
  lastUpdated?: string;
}

export async function getSiteSettings(): Promise<SiteSettings | null> {
  if (!isSanityConfigured) return null;
  return sanityClient.fetch(siteSettingsQuery);
}

export async function getBreakingNews(): Promise<BreakingNewsItem[]> {
  if (!isSanityConfigured) return [];
  return sanityClient.fetch(breakingNewsQuery);
}

export async function getTools(): Promise<ToolItem[]> {
  if (!isSanityConfigured) return [];
  return sanityClient.fetch(toolsQuery);
}

export async function getLegalPage(slug: string): Promise<LegalPage | null> {
  if (!isSanityConfigured) return null;
  return sanityClient.fetch(legalPageQuery, { slug });
}

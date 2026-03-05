import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';

export const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
});

const builder = imageUrlBuilder(sanityClient);

export function urlFor(source: any) {
  return builder.image(source);
}

// Queries
export const articlesQuery = `*[_type == "article"] | order(publishedAt desc) {
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
  tags
}`;

export const articleBySlugQuery = `*[_type == "article" && slug.current == $slug][0] {
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
  tags
}`;

export const pageBySlugQuery = `*[_type == "page" && slug.current == $slug][0] {
  _id,
  title,
  body,
  seo
}`;

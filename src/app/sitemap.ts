import type { MetadataRoute } from 'next';
import { createServiceClient } from '@/lib/supabase';

export const revalidate = 3600;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://nfireport.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const service = createServiceClient();

  // Fetch articles with real timestamps
  const articlesPromise = service
    ? service
        .from('articles')
        .select('slug, published_at, updated_at')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
    : Promise.resolve({ data: [] as { slug: string; published_at: string; updated_at: string | null }[] });

  // Fetch education categories
  const categoriesPromise = service
    ? service
        .from('education_categories')
        .select('slug, updated_at')
        .eq('available', true)
    : Promise.resolve({ data: [] as { slug: string; updated_at: string | null }[] });

  const [articlesResult, categoriesResult] = await Promise.all([
    articlesPromise,
    categoriesPromise,
  ]);

  const articles = ('data' in articlesResult ? articlesResult.data : articlesResult) || [];
  const categories = ('data' in categoriesResult ? categoriesResult.data : categoriesResult) || [];

  const staticPages: MetadataRoute.Sitemap = [
    '',
    '/economie',
    '/finance',
    '/entreprises',
    '/marches',
    '/education',
    '/outils',
    '/pricing',
    '/contact',
    '/connexion',
    '/inscription',
    '/cgu',
    '/confidentialite',
    '/mentions-legales',
    '/cookies',
    '/plan-du-site',
    '/about',
    '/publicite',
    '/niger',
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '' ? 'daily' : 'weekly',
    priority: path === '' ? 1 : 0.8,
  }));

  const toolPages: MetadataRoute.Sitemap = [
    'simulateur-emprunt',
    'interet-simple',
    'interet-compose',
    'simulateur-salaire',
    'indices-economiques',
  ].map((slug) => ({
    url: `${SITE_URL}/outil/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const articlePages: MetadataRoute.Sitemap = articles.map((a: { slug: string; published_at: string; updated_at: string | null }) => ({
    url: `${SITE_URL}/articles/${a.slug}`,
    lastModified: new Date(a.updated_at || a.published_at),
    changeFrequency: 'weekly',
    priority: 0.9,
  }));

  const educationPages: MetadataRoute.Sitemap = categories.map((cat: { slug: string; updated_at: string | null }) => ({
    url: `${SITE_URL}/education/${cat.slug}`,
    lastModified: cat.updated_at ? new Date(cat.updated_at) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...staticPages, ...toolPages, ...articlePages, ...educationPages];
}

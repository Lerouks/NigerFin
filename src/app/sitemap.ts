import type { MetadataRoute } from 'next';
import { createServiceClient } from '@/lib/supabase';
import { SITE_URL } from '@/lib/config';

export const revalidate = 3600;

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

  // Fetch enterprise slugs
  const enterprisesPromise = service
    ? service
        .from('strategic_enterprises')
        .select('slug, updated_at')
        .eq('is_visible', true)
    : Promise.resolve({ data: [] as { slug: string; updated_at: string | null }[] });

  // Fetch education categories
  const categoriesPromise = service
    ? service
        .from('education_categories')
        .select('slug, updated_at')
        .eq('available', true)
    : Promise.resolve({ data: [] as { slug: string; updated_at: string | null }[] });

  const [articlesResult, enterprisesResult, categoriesResult] = await Promise.all([
    articlesPromise,
    enterprisesPromise,
    categoriesPromise,
  ]);

  const articles = ('data' in articlesResult ? articlesResult.data : articlesResult) || [];
  const enterpriseRows = ('data' in enterprisesResult ? enterprisesResult.data : enterprisesResult) || [];
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
    'budget-familial',
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

  // Individual enterprise pages
  const enterprisePages: MetadataRoute.Sitemap = enterpriseRows
    .filter((e: { slug: string }) => e.slug)
    .map((e: { slug: string; updated_at: string | null }) => ({
      url: `${SITE_URL}/entreprises/${e.slug}`,
      lastModified: e.updated_at ? new Date(e.updated_at) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));

  return [...staticPages, ...toolPages, ...articlePages, ...enterprisePages, ...educationPages];
}

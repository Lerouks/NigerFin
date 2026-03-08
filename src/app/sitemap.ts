import type { MetadataRoute } from 'next';
import { getAllArticleSlugs } from '@/lib/articles';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://nfireport.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getAllArticleSlugs();

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

  const articlePages: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: `${SITE_URL}/articles/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.9,
  }));

  return [...staticPages, ...toolPages, ...articlePages];
}

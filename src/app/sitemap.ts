import type { MetadataRoute } from 'next';
import { createServiceClient } from '@/lib/supabase';
import { SITE_URL } from '@/lib/config';
import { SITEMAP_ENTRIES } from '@/lib/navigation';
import { getCours } from '@/lib/apprendre/donnees';

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

  // Apprendre : les cours ouverts et leurs leçons publiées, rien de caché.
  const coursPromise = getCours().catch(() => []);

  const [articlesResult, enterprisesResult, cours] = await Promise.all([
    articlesPromise,
    enterprisesPromise,
    coursPromise,
  ]);

  const articles = ('data' in articlesResult ? articlesResult.data : articlesResult) || [];
  const enterpriseRows = ('data' in enterprisesResult ? enterprisesResult.data : enterprisesResult) || [];

  // SEO M-1 : /connexion et /inscription retires - contradiction avec
  // robots.txt Disallow (Perf H-5). Les pages auth sont noindex en plus.
  const staticPages: MetadataRoute.Sitemap = [
    '',
    // Rubriques DERIVEES de la source unique : plus aucun risque qu'une rubrique
    // ajoutee a la barre soit oubliee ici, ce qui etait deja arrive.
    ...SITEMAP_ENTRIES.map((entry) => entry.path),
    // Pages transactionnelles et editoriales, listees a la main car ce ne sont
    // pas des rubriques.
    // /premium etait ABSENTE alors que c'est la destination du bouton principal
    // « S'abonner » du Header, desktop comme mobile, et qu'elle declare son
    // propre canonical : la page de conversion la plus mise en avant du site
    // n'etait pas soumise a l'indexation. /articles et /newsletter manquaient
    // egalement, sans etre bloquees par robots.txt ni marquees noindex.
    '/premium',
    '/articles',
    '/newsletter',
    '/pricing',
    '/contact',
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
    'emprunt',
    'interets-simples',
    'interets-composes',
    'salaire',
    'indices-economiques',
    'budget-familial',
  ].map((slug) => ({
    url: `${SITE_URL}/simulateurs/${slug}`,
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

  const pagesApprendre: MetadataRoute.Sitemap = cours.flatMap((c) => [
    {
      url: `${SITE_URL}${c.href}`,
      lastModified: new Date(Math.max(...c.lecons.map((l) => Date.parse(l.publieeLe)))),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    ...c.lecons.map((l) => ({
      url: `${SITE_URL}${l.href}`,
      lastModified: new Date(l.publieeLe),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ]);

  // Individual enterprise pages
  const enterprisePages: MetadataRoute.Sitemap = enterpriseRows
    .filter((e: { slug: string }) => e.slug)
    .map((e: { slug: string; updated_at: string | null }) => ({
      url: `${SITE_URL}/entreprises/${e.slug}`,
      lastModified: e.updated_at ? new Date(e.updated_at) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));

  return [...staticPages, ...toolPages, ...articlePages, ...enterprisePages, ...pagesApprendre];
}

import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/config';

// Perf H-5 / SEO H-1 : on bloque explicitement les chemins prives et techniques
// du crawl. Sans Disallow, Google indexe les pages /admin, /api, /compte etc.
// => gaspillage de crawl budget + risque de leak de chemins internes dans la SERP.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/api',
          '/compte',
          '/connexion',
          '/inscription',
          '/paiement',
          '/auth/',
          '/newsletter/desabonnement',
          '/dev-cockpit-preview',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArticleCard } from '@/components/ArticleCard';
import { EnterprisesAtlas } from '@/components/entreprises/EnterprisesAtlas';
import { getArticlesByCategory } from '@/lib/articles';
import {
  getStrategicEnterprises,
  getFeaturedEnterprise,
} from '@/lib/strategic-enterprises';

export const revalidate = 3600;
export const metadata: Metadata = {
  title: 'Atlas économique du Niger',
  description:
    "Les entreprises stratégiques du Niger par secteur : mines, énergie, télécoms, banque, agriculture. Le panorama économique du pays par la rédaction NFI Report.",
  alternates: { canonical: '/entreprises' },
};

export default async function EntreprisesPage() {
  const [enterprises, featured, { articles }] = await Promise.all([
    getStrategicEnterprises(),
    getFeaturedEnterprise(),
    getArticlesByCategory('entreprises', 1, 6),
  ]);

  const recentArticles = articles.slice(0, 6);

  return (
    <>
      <EnterprisesAtlas enterprises={enterprises} featured={featured} />

      {/* Chapitre editorial : actualite entreprises (vrai titre + grille
          articles, plus de sidebar filtres dashboard SaaS) */}
      {recentArticles.length > 0 ? (
        <section
          aria-labelledby="atlas-news-heading"
          className="border-t border-black/10 bg-secondary/40"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <header className="mb-10 md:mb-14">
              <div className="flex items-baseline gap-3 mb-3">
                <span className="h-px w-8 bg-gold" />
                <span className="text-[11px] uppercase tracking-[0.22em] text-foreground font-extrabold">
                  Actualité
                </span>
              </div>
              <h2
                id="atlas-news-heading"
                className="text-[clamp(2rem,4.5vw,2.75rem)] font-black tracking-tight text-foreground leading-[1.05]"
              >
                Articles récents sur les entreprises
              </h2>
              <div aria-hidden className="mt-5 h-px w-16 bg-gold" />
              <p className="mt-5 text-[15px] md:text-[16px] italic text-gray-700 max-w-2xl leading-relaxed">
                Notre couverture des acteurs stratégiques nigériens et de leur
                environnement régional.
              </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {recentArticles.map((article) => (
                <ArticleCard key={article._id} article={article} />
              ))}
            </div>

            <div className="mt-12 flex justify-center">
              <Link
                href="/articles?category=entreprises"
                className="inline-flex items-center gap-2 text-[14px] font-bold text-foreground hover:text-foreground/70 transition-colors border-b-2 border-gold pb-1"
              >
                Voir tous les articles entreprises
                <svg aria-hidden width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7h10m0 0L8 3m4 4L8 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArticleCard } from '@/components/ArticleCard';
import { MarketDataWidget } from '@/components/MarketDataWidget';
import { CategoryHero } from '@/components/CategoryHero';
import { getArticlesByCategory } from '@/lib/articles';

export const revalidate = 60;
export const metadata: Metadata = { title: 'Finance', description: 'Actualités financières, analyses bancaires et tendances du secteur financier au Niger et en Afrique de l\'Ouest.' };

const PREVIEW_LIMIT = 6;

export default async function FinancePage() {
  const { articles, total } = await getArticlesByCategory('finance', 1, PREVIEW_LIMIT);
  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <CategoryHero
        label="Rubrique"
        title="Finance"
        description="Analyses bancaires et tendances du secteur financier au Niger et en Afrique de l'Ouest."
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger-grid">
              {articles.map((article) => (<ArticleCard key={article._id} article={article} />))}
            </div>
            {articles.length === 0 && (
              <div className="text-center py-20">
                <p className="text-gray-400 text-lg mb-2">Aucun article dans cette rubrique</p>
                <p className="text-gray-300 text-sm">De nouveaux contenus arrivent bientôt.</p>
              </div>
            )}
            {total > PREVIEW_LIMIT && (
              <div className="mt-10 text-center">
                <Link
                  href="/finance/articles"
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium border border-black/[0.08] rounded-full hover:bg-[#111] hover:text-white transition-all duration-300"
                >
                  Voir tous les articles de Finance
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              </div>
            )}
          </div>
          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-24">
              <MarketDataWidget />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

import type { Metadata } from 'next';
import { ArticleCard } from '@/components/ArticleCard';
import { MarketDataWidget } from '@/components/MarketDataWidget';
import { CategoryHero } from '@/components/CategoryHero';
import { getArticlesByCategory } from '@/lib/articles';

export const revalidate = 60;
export const metadata: Metadata = { title: 'Entreprises', description: 'Actualités des entreprises nigériennes et ouest-africaines : résultats, stratégies, fusions et opportunités d\'investissement.' };

export default async function EntreprisesPage() {
  const { articles } = await getArticlesByCategory('entreprises');
  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <CategoryHero
        label="Rubrique"
        title="Entreprises"
        description="Résultats, stratégies et opportunités d'investissement des entreprises nigériennes et ouest-africaines."
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

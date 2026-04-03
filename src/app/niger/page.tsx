import type { Metadata } from 'next';
import { ArticleCard } from '@/components/ArticleCard';
import { MarketDataWidget } from '@/components/MarketDataWidget';
import { NigerPresentation } from '@/components/NigerPresentation';
import { CategoryHero } from '@/components/CategoryHero';
import { getArticlesByCategory } from '@/lib/articles';
import { marketData } from '@/data/mock-data';

export const revalidate = 60;
export const metadata: Metadata = {
  title: 'Niger : économie, entreprises et analyses',
  description: 'Analyses économiques, entreprises, marchés et actualités du Niger.',
  openGraph: {
    title: 'Niger : économie, entreprises et analyses',
    description: 'Analyses économiques, entreprises, marchés et actualités du Niger.',
    type: 'website',
  },
};

export default async function NigerPage() {
  const { articles } = await getArticlesByCategory('niger');
  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <CategoryHero
        label="Rubrique"
        title="Niger"
        description="Analyses économiques, entreprises, marchés et actualités du Niger."
        accentGold
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger-grid">
              {articles.map((article) => (<ArticleCard key={article._id} article={article} />))}
            </div>
            {articles.length === 0 && <p className="text-gray-500 text-center py-20">Aucun article dans cette rubrique pour le moment.</p>}
          </div>
          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-24">
              <MarketDataWidget data={marketData} />
            </div>
          </aside>
        </div>

        <NigerPresentation />
      </div>
    </div>
  );
}

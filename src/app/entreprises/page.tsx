import type { Metadata } from 'next';
import { ArticleCard } from '@/components/ArticleCard';
import { MarketDataWidget } from '@/components/MarketDataWidget';
import { getArticlesByCategory } from '@/lib/articles';
import { marketData } from '@/data/mock-data';

export const revalidate = 60;
export const metadata: Metadata = { title: 'Entreprises' };

export default async function EntreprisesPage() {
  const articles = await getArticlesByCategory('entreprises');
  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <section className="bg-[#111] text-white py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-[11px] tracking-[0.2em] uppercase text-white/40 block mb-4">Rubrique</span>
          <h1 className="text-4xl md:text-5xl">Entreprises</h1>
        </div>
      </section>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {articles.map((article) => (<ArticleCard key={article._id} article={article} />))}
            </div>
            {articles.length === 0 && <p className="text-gray-500 text-center py-20">Aucun article dans cette rubrique pour le moment.</p>}
          </div>
          <aside className="lg:col-span-4"><MarketDataWidget data={marketData} /></aside>
        </div>
      </div>
    </div>
  );
}

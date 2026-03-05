import type { Metadata } from 'next';
import { ArticleCard } from '@/components/ArticleCard';
import { mockArticles, marketData } from '@/data/mock-data';
import { MarketDataWidget } from '@/components/MarketDataWidget';

export const metadata: Metadata = { title: 'Éducation' };

export default function EducationPage() {
  const articles = mockArticles.filter((a) => a.category === 'Éducation');
  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <section className="bg-[#111] text-white py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-[11px] tracking-[0.2em] uppercase text-white/40 block mb-4">Rubrique</span>
          <h1 className="text-4xl md:text-5xl">Éducation</h1>
        </div>
      </section>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {articles.map((article) => (<ArticleCard key={article._id} article={article} />))}
            </div>
          </div>
          <aside className="lg:col-span-4"><MarketDataWidget data={marketData} /></aside>
        </div>
      </div>
    </div>
  );
}

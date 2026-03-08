import type { Metadata } from 'next';
import { MarchesContent } from './MarchesContent';
import { ArticleCard } from '@/components/ArticleCard';
import { getArticlesByCategory } from '@/lib/articles';
import { marketData } from '@/data/mock-data';

export const revalidate = 60;
export const metadata: Metadata = { title: 'Marchés', description: 'Suivez les cours des marchés en temps réel : matières premières, devises, indices boursiers et actifs financiers africains.' };

export default async function MarchesPage() {
  const articles = await getArticlesByCategory('marches');
  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <section className="bg-[#111] text-white py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-[11px] tracking-[0.2em] uppercase text-white/40 block mb-4">Rubrique</span>
          <h1 className="text-4xl md:text-5xl">Marchés</h1>
          <p className="text-white/50 text-[16px] mt-4 max-w-2xl">
            Suivez les cours en temps réel et apprenez à comprendre chaque actif grâce à nos fiches pédagogiques.
          </p>
        </div>
      </section>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <MarchesContent fallbackData={marketData} />
      </div>
      {articles.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14 md:pb-20">
          <h2 className="text-2xl font-bold mb-8">Articles Marchés</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (<ArticleCard key={article._id} article={article} />))}
          </div>
        </div>
      )}
    </div>
  );
}

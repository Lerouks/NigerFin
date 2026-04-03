import type { Metadata } from 'next';
import { MarchesContent } from './MarchesContent';
import { ArticleCard } from '@/components/ArticleCard';
import { CategoryHero } from '@/components/CategoryHero';
import { getArticlesByCategory } from '@/lib/articles';

export const revalidate = 60;
export const metadata: Metadata = { title: 'Marchés', description: 'Suivez les cours des marchés en temps réel : matières premières, devises, indices boursiers et actifs financiers africains.' };

export default async function MarchesPage() {
  const { articles } = await getArticlesByCategory('marches');
  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <CategoryHero
        label="Rubrique"
        title="Marchés"
        description="Suivez les cours en temps réel et apprenez à comprendre chaque actif grâce à nos fiches pédagogiques."
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <MarchesContent />
      </div>
      {articles.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14 md:pb-20">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-[2px] bg-gold/40" />
            <h2 className="text-2xl font-bold">Articles Marchés</h2>
            <div className="flex-1 h-px bg-black/[0.06]" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-grid">
            {articles.map((article) => (<ArticleCard key={article._id} article={article} />))}
          </div>
        </div>
      )}
    </div>
  );
}

import type { Metadata } from 'next';
import { CategoryHero } from '@/components/CategoryHero';
import { SectionArticlesFiltered } from '@/components/SectionArticlesFiltered';
import { getArticlesByCategory, getArticleViewRanking } from '@/lib/articles';

export const revalidate = 60;
export const metadata: Metadata = { title: 'Économie', description: 'Actualités économiques du Niger et de l\'Afrique de l\'Ouest.' };

export default async function EconomiePage() {
  const [{ articles, total }, viewRanking] = await Promise.all([
    getArticlesByCategory('economie', 1, 500),
    getArticleViewRanking(),
  ]);
  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <CategoryHero label="Rubrique" title="Économie" description="Analyses et actualités économiques du Niger et de l'Afrique de l'Ouest." />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <SectionArticlesFiltered articles={articles} total={total} sectionLabel="Économie" sectionPath="/economie" viewRanking={viewRanking} />
      </div>
    </div>
  );
}

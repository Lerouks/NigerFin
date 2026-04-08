import type { Metadata } from 'next';
import { CategoryHero } from '@/components/CategoryHero';
import { SectionArticlesFiltered } from '@/components/SectionArticlesFiltered';
import { getArticlesByCategory, getArticleViewRanking } from '@/lib/articles';

export const revalidate = 60;
export const metadata: Metadata = { title: 'Finance', description: 'Actualités financières, analyses bancaires et tendances du secteur financier au Niger et en Afrique de l\'Ouest.' };

export default async function FinancePage() {
  const [{ articles, total }, viewRanking] = await Promise.all([
    getArticlesByCategory('finance', 1, 500),
    getArticleViewRanking(),
  ]);
  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <CategoryHero label="Rubrique" title="Finance" description="Analyses bancaires et tendances du secteur financier au Niger et en Afrique de l'Ouest." />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <SectionArticlesFiltered articles={articles} total={total} sectionLabel="Finance" sectionPath="/finance" viewRanking={viewRanking} />
      </div>
    </div>
  );
}

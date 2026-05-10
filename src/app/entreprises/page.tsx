import type { Metadata } from 'next';
import { CategoryHero } from '@/components/CategoryHero';
import { SectionArticlesFiltered } from '@/components/SectionArticlesFiltered';
import { getArticlesByCategory, getArticleViewRanking } from '@/lib/articles';

export const revalidate = 60;
export const metadata: Metadata = {
  title: 'Entreprises stratégiques du Niger',
  description: 'Actualités des entreprises nigériennes et ouest-africaines : résultats, stratégies, fusions et opportunités d\'investissement.',
  alternates: { canonical: '/entreprises' },
};

export default async function EntreprisesPage() {
  const [{ articles, total }, viewRanking] = await Promise.all([
    getArticlesByCategory('entreprises', 1, 500),
    getArticleViewRanking(),
  ]);
  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <CategoryHero label="Rubrique" title="Entreprises" description="Résultats, stratégies et opportunités d'investissement des entreprises nigériennes et ouest-africaines." />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <SectionArticlesFiltered articles={articles} total={total} sectionLabel="Entreprises" sectionPath="/entreprises" viewRanking={viewRanking} />
      </div>
    </div>
  );
}

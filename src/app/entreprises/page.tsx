import type { Metadata } from 'next';
import { CategoryHero } from '@/components/CategoryHero';
import { SectionArticlesFiltered } from '@/components/SectionArticlesFiltered';
import { StrategicEnterprisesSection } from '@/components/StrategicEnterprisesSection';
import { getArticlesByCategory, getArticleViewRanking } from '@/lib/articles';

export const revalidate = 3600;
export const metadata: Metadata = {
  title: 'Entreprises stratégiques du Niger',
  description: 'Les 8 piliers économiques du Niger et l\'actualité des entreprises nigériennes et ouest-africaines : résultats, stratégies, opportunités d\'investissement.',
  alternates: { canonical: '/entreprises' },
};

export default async function EntreprisesPage() {
  const [{ articles, total }, viewRanking] = await Promise.all([
    getArticlesByCategory('entreprises', 1, 500),
    getArticleViewRanking(),
  ]);
  return (
    <div className="min-h-screen bg-background">
      <CategoryHero
        label="Rubrique"
        title="Entreprises"
        description="Les 8 piliers stratégiques du Niger et l'actualité des entreprises de la sous-région ouest-africaine."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <StrategicEnterprisesSection />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14 md:pb-20">
        <SectionArticlesFiltered
          articles={articles}
          total={total}
          sectionLabel="Entreprises"
          sectionPath="/entreprises"
          viewRanking={viewRanking}
        />
      </div>
    </div>
  );
}

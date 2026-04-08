import type { Metadata } from 'next';
import { MarketDataWidget } from '@/components/MarketDataWidget';
import { CategoryHero } from '@/components/CategoryHero';
import { SectionArticlesFiltered } from '@/components/SectionArticlesFiltered';
import { getArticlesByCategory } from '@/lib/articles';

export const revalidate = 60;
export const metadata: Metadata = { title: 'Entreprises', description: 'Actualités des entreprises nigériennes et ouest-africaines : résultats, stratégies, fusions et opportunités d\'investissement.' };

export default async function EntreprisesPage() {
  const { articles, total } = await getArticlesByCategory('entreprises', 1, 500);
  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <CategoryHero label="Rubrique" title="Entreprises" description="Résultats, stratégies et opportunités d'investissement des entreprises nigériennes et ouest-africaines." />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8">
            <SectionArticlesFiltered articles={articles} total={total} sectionLabel="Entreprises" sectionPath="/entreprises" />
          </div>
          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-24"><MarketDataWidget /></div>
          </aside>
        </div>
      </div>
    </div>
  );
}

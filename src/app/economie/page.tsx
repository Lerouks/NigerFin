import type { Metadata } from 'next';
import { MarketDataWidget } from '@/components/MarketDataWidget';
import { CategoryHero } from '@/components/CategoryHero';
import { SectionArticlesFiltered } from '@/components/SectionArticlesFiltered';
import { getArticlesByCategory } from '@/lib/articles';

export const revalidate = 60;
export const metadata: Metadata = { title: 'Économie', description: 'Actualités économiques du Niger et de l\'Afrique de l\'Ouest.' };

export default async function EconomiePage() {
  const { articles, total } = await getArticlesByCategory('economie', 1, 500);
  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <CategoryHero label="Rubrique" title="Économie" description="Analyses et actualités économiques du Niger et de l'Afrique de l'Ouest." />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8">
            <SectionArticlesFiltered articles={articles} total={total} sectionLabel="Économie" sectionPath="/economie" />
          </div>
          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-24"><MarketDataWidget /></div>
          </aside>
        </div>
      </div>
    </div>
  );
}

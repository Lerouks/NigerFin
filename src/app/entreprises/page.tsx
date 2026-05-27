import type { Metadata } from 'next';
import { SectionArticlesFiltered } from '@/components/SectionArticlesFiltered';
import { EnterprisesAtlas } from '@/components/entreprises/EnterprisesAtlas';
import { getArticlesByCategory, getArticleViewRanking } from '@/lib/articles';
import {
  getStrategicEnterprises,
  getFeaturedEnterprise,
} from '@/lib/strategic-enterprises';

export const revalidate = 3600;
export const metadata: Metadata = {
  title: 'Atlas economique du Niger',
  description:
    "Les entreprises strategiques du Niger : mines, energie, telecommunications, banque, agriculture. Cartographie editoriale du tissu economique nigerien par NFI Report.",
  alternates: { canonical: '/entreprises' },
};

export default async function EntreprisesPage() {
  const [enterprises, featured, { articles, total }, viewRanking] =
    await Promise.all([
      getStrategicEnterprises(),
      getFeaturedEnterprise(),
      getArticlesByCategory('entreprises', 1, 500),
      getArticleViewRanking(),
    ]);

  return (
    <>
      <EnterprisesAtlas enterprises={enterprises} featured={featured} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 md:pb-24">
        <div className="pt-10 border-t border-black/10">
          <div className="flex items-baseline gap-3 mb-2">
            <span className="h-px w-6 bg-gold" />
            <span className="text-[10px] uppercase tracking-[0.22em] text-gold font-semibold">
              Actualite
            </span>
          </div>
          <h2 className="text-[clamp(1.5rem,3vw,2rem)] font-bold tracking-tight text-foreground leading-tight mb-6">
            Articles recents sur les entreprises
          </h2>
          <SectionArticlesFiltered
            articles={articles}
            total={total}
            sectionLabel="Entreprises"
            sectionPath="/entreprises"
            viewRanking={viewRanking}
          />
        </div>
      </div>
    </>
  );
}

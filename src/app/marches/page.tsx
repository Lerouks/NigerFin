import type { Metadata } from 'next';
import { MarchesContent } from './MarchesContent';
import { CategoryHero } from '@/components/CategoryHero';
import { HubFooter } from '@/components/HubFooter';
import { MacroIndicatorsBlock } from '@/components/MacroIndicatorsBlock';
import { SectionArticlesFiltered } from '@/components/SectionArticlesFiltered';
import { COMMODITIES_NIGER_EXPOSED, FOOD_PRICES_2025, INS_LAST_UPDATE } from '@/data/ins-indicators';
import { getArticlesByCategory, getArticleViewRanking } from '@/lib/articles';

export const revalidate = 3600;
export const metadata: Metadata = {
  title: 'Marchés financiers : indices, devises, BRVM',
  description: 'Suivez les cours des marchés en temps réel : matières premières, devises, indices boursiers et actifs financiers africains, dont la BRVM.',
  alternates: { canonical: '/marches' },
};

export default async function MarchesPage() {
  const [{ articles, total }, viewRanking] = await Promise.all([
    getArticlesByCategory('marches', 1, 500),
    getArticleViewRanking(),
  ]);
  return (
    <div className="min-h-screen bg-background">
      <CategoryHero
        label="Rubrique"
        title="Marchés"
        description="Suivez les cours en temps réel et apprenez à comprendre chaque actif grâce à nos fiches pédagogiques."
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <MarchesContent />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14 md:pb-20">
        <MacroIndicatorsBlock
          eyebrow="Matières premières"
          title="Cours mondiaux qui pèsent sur le Niger"
          subtitle="Or, uranium, pétrole et fer. Le Niger figure parmi les exportateurs stratégiques de ces 4 actifs."
          indicators={COMMODITIES_NIGER_EXPOSED}
          columns={4}
          asOf={INS_LAST_UPDATE}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14 md:pb-20">
        <MacroIndicatorsBlock
          eyebrow="Produits alimentaires"
          title="Cours des céréales importées au Niger"
          subtitle="Blé, riz, maïs et sucre, principales matières alimentaires importées. Ces cours impactent directement le coût de la vie."
          indicators={FOOD_PRICES_2025}
          columns={4}
          asOf={INS_LAST_UPDATE}
        />
      </div>
      {(articles.length > 0 || total > 0) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14 md:pb-20">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-2xl font-bold">Articles Marchés</h2>
            <div className="flex-1 h-px bg-black/6" />
          </div>
          <SectionArticlesFiltered articles={articles} total={total} sectionLabel="Marchés" sectionPath="/marches" viewRanking={viewRanking} />
        </div>
      )}
      <HubFooter
        paragraphs={[
          "La rubrique Marchés de NFI Report rassemble les cours en temps réel et les analyses des principaux actifs financiers qui influencent l'économie nigérienne et ouest-africaine. Indices boursiers, devises, matières premières, actions cotées sur la BRVM (Bourse Régionale des Valeurs Mobilières) : nous couvrons tous les marchés que tout investisseur, importateur ou décideur doit suivre pour anticiper les évolutions de prix et prendre des décisions éclairées.",
          "Le Niger, intégré à la zone UEMOA grâce au franc CFA, est exposé à plusieurs marchés : le marché des changes (parité fixe FCFA/EUR à 655,957, fluctuations USD/CNY/NGN), les matières premières que le pays exporte (uranium, pétrole, or) ou importe (céréales, carburants), et les indices régionaux (BRVM Composite, BRVM 10) qui reflètent la santé des entreprises cotées de la sous-région. Comprendre ces dynamiques permet de protéger son patrimoine, d'optimiser ses achats à l'international et d'investir avec discernement.",
          "Nos fiches pédagogiques accompagnent chaque cours pour expliquer les facteurs clés (offre/demande, géopolitique, politique monétaire, tensions commerciales) qui font bouger les marchés au quotidien.",
        ]}
        highlights={[
          { title: 'BRVM et marchés actions', body: 'Cours et analyses des sociétés cotées à Abidjan, dont les fleurons ouest-africains qui structurent l\'épargne longue.' },
          { title: 'Devises et change', body: 'EUR, USD, CNY, NGN face au FCFA : suivez les parités qui pèsent sur les importations et le coût de la vie.' },
          { title: 'Matières premières', body: 'Uranium, pétrole, or, céréales : les cours mondiaux qui impactent directement les exportations du Niger.' },
          { title: 'Indicateurs UEMOA', body: 'Taux directeur BCEAO, inflation IHPC, réserves de change : les données qui pilotent l\'économie régionale.' },
        ]}
      />
    </div>
  );
}

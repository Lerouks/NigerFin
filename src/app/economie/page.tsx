import type { Metadata } from 'next';
import { CategoryHero } from '@/components/CategoryHero';
import { HubFooter } from '@/components/HubFooter';
import { SectionArticlesFiltered } from '@/components/SectionArticlesFiltered';
import { getArticlesByCategory, getArticleViewRanking } from '@/lib/articles';

export const revalidate = 3600;
export const metadata: Metadata = {
  title: 'Économie du Niger : actualités et analyses',
  description: 'Actualités, analyses et indicateurs économiques du Niger et de l\'Afrique de l\'Ouest : croissance, inflation, secteurs clés, politiques publiques.',
  alternates: { canonical: '/economie' },
};

export default async function EconomiePage() {
  const [{ articles, total }, viewRanking] = await Promise.all([
    getArticlesByCategory('economie', 1, 500),
    getArticleViewRanking(),
  ]);
  return (
    <div className="min-h-screen bg-background">
      <CategoryHero label="Rubrique" title="Économie" description="Analyses et actualités économiques du Niger et de l'Afrique de l'Ouest." />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <SectionArticlesFiltered articles={articles} total={total} sectionLabel="Économie" sectionPath="/economie" viewRanking={viewRanking} />
      </div>
      <HubFooter
        paragraphs={[
          "La rubrique Économie de NFI Report couvre l'actualité, les analyses et les indicateurs qui façonnent la trajectoire économique du Niger et de l'Afrique de l'Ouest. Croissance\u00A0du\u00A0PIB, inflation, balance commerciale, dette publique, secteurs stratégiques (agriculture, mines, énergie, services) : nous décryptons les chiffres et les politiques qui impactent le quotidien des Nigériens et les perspectives de développement régional.",
          "Le Niger affiche des fondamentaux économiques particuliers : une économie agricole dominante (40 % du PIB), une dépendance forte aux matières premières exportées (uranium, pétrole, or), une démographie jeune et croissante, et une intégration profonde dans la zone UEMOA grâce au franc CFA. Les politiques de la BCEAO, du FMI, de la Banque mondiale et l'environnement économique régional (échanges intra-UEMOA, investissements étrangers, cours des matières premières) influencent directement les conditions de croissance et d'investissement.",
          "Décideurs, investisseurs, étudiants en sciences économiques : nos analyses donnent une grille de lecture rigoureuse pour suivre la conjoncture nigérienne et anticiper ses tendances.",
        ]}
        highlights={[
          { title: 'Indicateurs macroéconomiques', body: 'PIB, inflation, dette, balance commerciale : les chiffres clés actualisés pour le Niger et l\'UEMOA.' },
          { title: 'Politiques publiques', body: 'Décryptage des budgets, lois de finances et stratégies sectorielles de l\'État nigérien.' },
          { title: 'Secteurs stratégiques', body: 'Agriculture, mines, énergie, télécoms : analyses des dynamiques et défis sectoriels.' },
          { title: 'Intégration régionale', body: 'UEMOA, marché ouest-africain, flux commerciaux et investissements étrangers : les dynamiques qui pèsent sur l\'économie.' },
        ]}
      />
    </div>
  );
}

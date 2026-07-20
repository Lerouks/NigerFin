import type { Metadata } from 'next';
import { CategoryHero } from '@/components/CategoryHero';
import { HubFooter } from '@/components/HubFooter';
import { SectionArticlesFiltered } from '@/components/SectionArticlesFiltered';
import { getArticlesByCategory, getArticleViewRanking } from '@/lib/articles';

export const revalidate = 3600;
export const metadata: Metadata = {
  title: 'Finance au Niger : marchés, banques, placements',
  description: 'Actualités financières, analyses bancaires et tendances du secteur financier au Niger et en Afrique de l\'Ouest : crédit, épargne, placements, BRVM.',
  alternates: { canonical: '/finance' },
};

export default async function FinancePage() {
  const [{ articles, total }, viewRanking] = await Promise.all([
    getArticlesByCategory('finance', 1, 500),
    getArticleViewRanking(),
  ]);
  return (
    <div className="min-h-screen bg-background">
      <CategoryHero label="Rubrique" title="Finance" description="Votre argent : banques, crédit, épargne, placements et marchés au Niger et en Afrique de l'Ouest." />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        {/*
          Facette « Marchés & BRVM » : la rubrique Marchés est sortie de la barre
          de navigation et ses articles ont rejoint Finance. La facette leur rend
          une porte d'entree directe, sans recreer une rubrique entiere. La page
          /marches reste, elle, accessible et n'est jamais redirigee.
        */}
        <SectionArticlesFiltered
          articles={articles}
          total={total}
          sectionLabel="Finance"
          sectionPath="/finance"
          viewRanking={viewRanking}
          facets={[{ key: 'marches', label: 'Marchés & BRVM' }]}
        />
      </div>
      <HubFooter
        paragraphs={[
          "La rubrique Finance de NFI Report regroupe les actualités, analyses et décryptages du secteur financier au Niger, dans la zone UEMOA et plus largement en Afrique de l'Ouest. Banques commerciales, microfinance, marchés de capitaux, paiements numériques, inclusion financière : nous couvrons tous les sujets qui façonnent l'accès au crédit, à l'épargne et à l'investissement pour les particuliers comme pour les entreprises.",
          "L'écosystème financier nigérien évolue rapidement, porté par l'essor du Mobile Money, la modernisation des services bancaires, l'arrivée de fintechs innovantes et l'intégration croissante avec les marchés régionaux. Les décisions de la BCEAO (Banque Centrale des États de l'Afrique de l'Ouest), les politiques du FMI et les mouvements des grandes banques panafricaines impactent directement le pouvoir d'achat, le coût du crédit et les opportunités d'investissement disponibles localement.",
          "Professionnels du secteur, dirigeants d'entreprise, investisseurs particuliers : nos articles éclairent les évolutions du système financier nigérien et ouest-africain.",
        ]}
        highlights={[
          { title: 'Banques au Niger', body: 'Suivi des établissements de crédit (SONIBANK, BAGRI, BOA, Ecobank, Atlantique) et de leur stratégie face à la transition numérique.' },
          { title: 'BCEAO et UEMOA', body: 'Décryptage des décisions de politique monétaire, des taux directeurs et de l\'évolution du cadre prudentiel régional.' },
          { title: 'Fintechs et Mobile Money', body: 'Analyses des acteurs (Airtel Money, Moov Money, Nita) et de leur impact sur l\'inclusion financière.' },
          { title: 'Marchés de capitaux', body: 'BRVM, obligations souveraines et privées, levées de fonds : suivi du financement long terme de l\'économie.' },
        ]}
      />
    </div>
  );
}

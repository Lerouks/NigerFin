import type { Metadata } from 'next';
import { CategoryHero } from '@/components/CategoryHero';
import { CoursDuJour } from '@/components/finance/CoursDuJour';
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
      <CategoryHero title="Finance" description="Votre argent : banques, crédit, épargne, placements et marchés au Niger et en Afrique de l'Ouest." />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 md:pt-12 pb-14 md:pb-20">
        {/* Les cours du jour : euro, dollar, naira, BRVM, or et Brent (24/11/2026). */}
        <div className="mb-12 md:mb-16">
          <CoursDuJour />
        </div>
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
          "La rubrique Finance de NFI Report regroupe les actualités, analyses et décryptages du secteur financier au Niger, dans la zone UEMOA et en Afrique de l'Ouest. Nous y suivons les banques, la microfinance, les marchés de capitaux, les paiements numériques et l'inclusion financière, tout ce qui décide de l'accès au crédit, à l'épargne et à la Bourse.",
          "L'écosystème financier nigérien évolue rapidement, porté par l'essor du Mobile Money, la modernisation des services bancaires, l'arrivée de fintechs innovantes et l'intégration croissante avec les marchés régionaux. Les décisions de la BCEAO (Banque centrale des États de l'Afrique de l'Ouest), les politiques du FMI et les choix des grandes banques panafricaines pèsent directement sur le pouvoir d'achat, le coût du crédit et l'épargne de chacun.",
          "Professionnels du secteur, dirigeants d'entreprise, investisseurs particuliers : nos articles éclairent les évolutions du système financier, au Niger et dans toute la région.",
        ]}
        highlights={[
          { title: 'Banques au Niger', body: 'Suivi des établissements de crédit (SONIBANK, BAGRI, BOA, Ecobank, Atlantique) et de leur stratégie face à la transition numérique.' },
          { title: 'BCEAO et UEMOA', body: 'Décryptage des décisions de politique monétaire, des taux directeurs et de l\'évolution du cadre prudentiel régional.' },
          { title: 'Fintechs et Mobile Money', body: 'Analyses des acteurs (Airtel Money, Moov Money, Nita) et de ce qu\'ils changent pour les ménages.' },
          { title: 'Marchés de capitaux', body: 'BRVM, obligations souveraines et privées, levées de fonds : suivi du financement long terme de l\'économie.' },
        ]}
      />
    </div>
  );
}

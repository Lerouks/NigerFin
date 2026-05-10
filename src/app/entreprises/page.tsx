import type { Metadata } from 'next';
import { CategoryHero } from '@/components/CategoryHero';
import { HubIntro } from '@/components/HubIntro';
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
      <HubIntro
        paragraphs={[
          "La rubrique Entreprises de NFI Report suit l'actualité des sociétés qui façonnent l'économie du Niger et de l'Afrique de l'Ouest. Des géants stratégiques publics (SOMAÏR, COMINAK, NIGELEC, SONIDEP, SONIBANK, BAGRI, SOPAMIN, Niger Telecoms) aux PME et startups en pleine émergence, nous décryptons les résultats financiers, les changements de gouvernance, les fusions-acquisitions, les stratégies sectorielles et les opportunités d'investissement.",
          "Le tissu entrepreneurial nigérien combine des entreprises publiques historiques héritées de l'après-indépendance, des filiales de grands groupes internationaux (Orano, CNPC, Maroc Telecom), des banques régionales (BOA, Ecobank, Atlantique) et un écosystème de PME/PMI dans l'agro-industrie, le BTP, le commerce et les services. Comprendre la structure capitalistique, les modèles d'affaires et les défis spécifiques de ces entreprises permet d'éclairer les choix d'investisseurs, de partenaires et de candidats à l'embauche.",
          "L'intégration UEMOA et CEDEAO, l'évolution du cadre OHADA, la digitalisation accélérée et les tensions géopolitiques récentes redessinent en profondeur le paysage entrepreneurial. Nos analyses vous aident à anticiper ces transformations.",
        ]}
        highlights={[
          { title: 'Entreprises stratégiques du Niger', body: 'Suivi détaillé des 8 piliers publics et privés qui structurent les secteurs stratégiques nationaux.' },
          { title: 'Banques et fintechs', body: 'Performance financière, stratégies de digitalisation et conformité au cadre prudentiel UEMOA.' },
          { title: 'PME et startups', body: 'Levées de fonds, modèles disruptifs et défis de croissance dans l\'écosystème entrepreneurial nigérien.' },
          { title: 'Multinationales en Afrique', body: 'Implantations, partenariats et stratégies des grands groupes internationaux dans la sous-région.' },
        ]}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <SectionArticlesFiltered articles={articles} total={total} sectionLabel="Entreprises" sectionPath="/entreprises" viewRanking={viewRanking} />
      </div>
    </div>
  );
}

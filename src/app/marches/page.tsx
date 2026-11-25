import type { Metadata } from 'next';
import { CategoryHero } from '@/components/CategoryHero';
import { HubFooter } from '@/components/HubFooter';
import { SectionArticlesFiltered } from '@/components/SectionArticlesFiltered';
import { CoursDuJour } from '@/components/finance/CoursDuJour';
import { MentionCours } from '@/components/finance/MentionCours';
import { DevisesBceao } from '@/components/marches/DevisesBceao';
import { SeanceBrvm } from '@/components/marches/SeanceBrvm';
import { getArticlesByCategory, getArticleViewRanking } from '@/lib/articles';

/**
 * Page Marchés, refaite le 25/11/2026 sur des sources officielles publiées
 * chaque jour : les cours du jour de la page Finance, le franc CFA face aux
 * devises (BCEAO) et la séance complète de la BRVM. Elle remplace une liste
 * tirée de l'ancienne table market_data, qui promettait « le temps réel », et
 * deux tableaux de moyennes trimestrielles du FMI arrêtées au T4 2025.
 * Chaque bloc disparaît seul si sa source ne se met plus à jour.
 */

export const revalidate = 3600;
export const metadata: Metadata = {
  title: 'Marchés : franc CFA, devises, BRVM, or et pétrole',
  description:
    'Les cours du jour qui comptent au Niger : le franc CFA face aux devises, la séance de la BRVM, l’or, le pétrole et le taux directeur de la BCEAO, de sources officielles.',
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
        title="Marchés"
        description="Le franc CFA face aux devises, la séance de la BRVM, l’or et le pétrole : les cours qui comptent au Niger, chaque jour, de sources officielles."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 md:pt-12 pb-14 md:pb-20 space-y-8 md:space-y-10">
        <CoursDuJour />
        <div className="grid grid-cols-1 gap-8 md:gap-10 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <SeanceBrvm />
          </div>
          <div className="lg:col-span-2">
            <DevisesBceao />
          </div>
        </div>
        <p className="max-w-2xl text-[13px] leading-snug text-gray-500">
          <MentionCours />
        </p>
      </div>

      {(articles.length > 0 || total > 0) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14 md:pb-20">
          <div className="mb-8 pb-3 border-b border-black/10">
            <h2 className="text-2xl font-bold">Articles Marchés</h2>
          </div>
          <SectionArticlesFiltered articles={articles} total={total} sectionLabel="Marchés" sectionPath="/marches" viewRanking={viewRanking} />
        </div>
      )}

      <HubFooter
        paragraphs={[
          'La page Marchés de NFI Report rassemble chaque jour les cours qui comptent pour le Niger : le franc CFA face aux grandes devises, la séance de la BRVM, l’or, le pétrole et le taux directeur de la BCEAO.',
          'Chaque chiffre vient de la source qui le publie. La BCEAO donne les cours des devises et son taux directeur, la Banque centrale du Nigeria celui du naira, la BRVM les indices et les actions. Un cours qui ne se met plus à jour disparaît de la page au lieu de vieillir.',
        ]}
        highlights={[
          { title: 'Le franc CFA', body: 'Sa parité avec l’euro est fixe. Face au dollar, au yuan ou au naira, sa valeur change chaque jour, et avec elle le prix de ce que le Niger importe.' },
          { title: 'La BRVM', body: 'La Bourse commune aux huit pays de l’UEMOA. Bank of Africa Niger y est la seule société nigérienne cotée.' },
          { title: 'L’or et le pétrole', body: 'Deux cours mondiaux qui pèsent sur les recettes du Niger. L’INS chiffre le pétrole brut à 89 % des exportations du pays fin 2025.' },
          { title: 'La BCEAO', body: 'Son taux directeur fixe le prix auquel les banques se refinancent auprès d’elle, et donc le coût du crédit.' },
        ]}
      />
    </div>
  );
}

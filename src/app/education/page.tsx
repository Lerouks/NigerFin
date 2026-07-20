import type { Metadata } from 'next';
import { CategoryHero } from '@/components/CategoryHero';
import { HubFooter } from '@/components/HubFooter';
import { EducationGrid } from './EducationGrid';
import { LearningPathsSection } from '@/components/LearningPathsSection';
import { createServiceClient } from '@/lib/supabase';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Éducation financière : cours et ressources',
  description: 'Apprenez la finance, l\'économie et les marchés à votre rythme grâce à nos cours et ressources pédagogiques gratuits, adaptés au contexte africain.',
  alternates: { canonical: '/education' },
};

async function getCategories() {
  const supabase = createServiceClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from('education_categories')
    .select('id, slug, title, icon, description, available, education_lessons(id)')
    .eq('available', true)
    .order('sort_order');

  return (data || []).map((cat: Record<string, unknown> & { education_lessons?: { id: string }[] }) => ({
    id: cat.id as string,
    slug: cat.slug as string,
    title: cat.title as string,
    icon: cat.icon as string,
    description: cat.description as string,
    available: cat.available as boolean,
    sort_order: cat.sort_order as number,
    lesson_count: cat.education_lessons?.length || 0,
  }));
}

export default async function EducationPage() {
  const categories = await getCategories();

  return (
    <div className="min-h-screen bg-background">
      <CategoryHero
        title="Éducation"
        description="Apprenez la finance, l'économie et les marchés à votre rythme. Choisissez une catégorie pour commencer."
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold leading-tight">Toutes les catégories</h2>
            <p className="text-[13px] text-gray-500 mt-1">
              Explore librement par thème, au rythme qui te convient.
            </p>
          </div>
        </div>
        <EducationGrid categories={categories} />
        <div className="mt-16 md:mt-24">
          <LearningPathsSection />
        </div>
      </div>
      <HubFooter
        paragraphs={[
          "L'éducation financière reste l'un des piliers de l'autonomie économique et de la réussite patrimoniale, en particulier dans un contexte ouest-africain où l'inclusion financière progresse mais où la culture financière demeure peu démocratisée. La section Éducation de NFI Report propose des cours, leçons et parcours guidés gratuits, conçus pour tous les niveaux, du débutant complet à l'investisseur averti.",
          "Notre pédagogie s'appuie sur des cas concrets adaptés au Niger et à la zone UEMOA : choix d'une banque locale, ouverture d'un compte titres BRVM via une SGI, calcul de l'ITS sur votre fiche de paie, gestion d'un budget familial en FCFA, comparaison entre Mobile Money et compte bancaire, fiscalité OHADA pour les entrepreneurs. Chaque catégorie regroupe une série de leçons progressives, courtes et accessibles, avec des exemples chiffrés et des conseils pratiques.",
          "Nos parcours s'adressent aussi bien à l'étudiant qu'au salarié, à l'entrepreneur ou à l'investisseur particulier. Les leçons gratuites posent les bases ; les leçons Premium creusent chaque sujet avec des études de cas et des calculs détaillés.",
        ]}
        highlights={[
          { title: 'Catégories thématiques', body: 'Budget, banque, bourse, immobilier, crypto, fiscalité, assurance, entrepreneuriat : un panorama complet.' },
          { title: 'Parcours guidés', body: 'Suivez des séquences pédagogiques structurées du débutant à l\'investisseur autonome.' },
          { title: 'Cas concrets Niger', body: 'Exemples chiffrés, comparaisons de banques locales, fiscalité OHADA, paiements mobile money.' },
          { title: 'Leçons gratuites', body: 'Une bonne partie du contenu est accessible sans abonnement, pour démocratiser la culture financière.' },
        ]}
      />
    </div>
  );
}

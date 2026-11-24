import type { Metadata } from 'next';
import { CategoryHero } from '@/components/CategoryHero';
import { HubFooter } from '@/components/HubFooter';
import { EducationGrid } from './EducationGrid';
import { LearningPathsSection } from '@/components/LearningPathsSection';
import { createServiceClient } from '@/lib/supabase';
import { paragrapheFr } from '@/lib/typographie-fr';

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
        title="Apprendre"
        description="Apprenez la finance, l'économie et les marchés à votre rythme, thème par thème ou en suivant un parcours."
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold leading-tight">Toutes les catégories</h2>
            <p className="text-[13px] text-gray-500 mt-1">
              {paragrapheFr('Explorez librement par thème, au rythme qui vous convient.')}
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
          "L'éducation financière reste l'un des piliers de l'autonomie économique et de la réussite patrimoniale, en particulier dans un contexte ouest-africain où l'inclusion financière progresse mais où la culture financière demeure peu démocratisée. Dans Apprendre, NFI Report propose des cours, des leçons et des parcours guidés pour tous les niveaux, du premier budget à l'investissement en Bourse.",
          "Notre pédagogie s'appuie sur des cas concrets adaptés au Niger et à la zone UEMOA : choix d'une banque locale, ouverture d'un compte titres BRVM via une SGI, calcul de l'ITS sur votre fiche de paie, gestion d'un budget familial en FCFA, comparaison entre Mobile Money et compte bancaire, fiscalité et droit OHADA pour les entrepreneurs. Chaque thème réunit des leçons progressives, courtes et accessibles, avec des exemples chiffrés et des conseils pratiques.",
          "Nos parcours s'adressent aussi bien à l'étudiant qu'au salarié, à l'entrepreneur ou à l'investisseur particulier. Les leçons gratuites posent les bases ; les leçons Premium creusent chaque sujet avec des études de cas et des calculs détaillés.",
        ]}
        highlights={[
          { title: 'Catégories thématiques', body: 'Budget, banque, Bourse, immobilier, crypto, fiscalité, assurance, entrepreneuriat : chaque grand sujet a ses leçons.' },
          { title: 'Parcours guidés', body: 'Suivez des leçons dans l\'ordre, des premières notions jusqu\'à vos propres placements.' },
          { title: 'Cas concrets Niger', body: 'Exemples chiffrés, comparaisons de banques locales, droit OHADA, paiements par Mobile Money.' },
          { title: 'Leçons gratuites', body: 'Une bonne partie des leçons est accessible sans abonnement : tout le monde peut apprendre.' },
        ]}
      />
    </div>
  );
}

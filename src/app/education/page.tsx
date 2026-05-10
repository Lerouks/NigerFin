import type { Metadata } from 'next';
import { CategoryHero } from '@/components/CategoryHero';
import { EducationGrid } from './EducationGrid';
import { LearningPathsSection } from '@/components/LearningPathsSection';
import { createServiceClient } from '@/lib/supabase';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Éducation financière : cours et ressources',
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
    <div className="min-h-screen bg-[#fafaf9]">
      <CategoryHero
        label="Rubrique"
        title="Éducation"
        description="Apprenez la finance, l'économie et les marchés à votre rythme. Choisissez une catégorie pour commencer."
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <LearningPathsSection />
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold leading-tight">Toutes les catégories</h2>
            <p className="text-[13px] text-gray-500 mt-1">
              Explore librement par thème, au rythme qui te convient.
            </p>
          </div>
        </div>
        <EducationGrid categories={categories} />
      </div>
    </div>
  );
}

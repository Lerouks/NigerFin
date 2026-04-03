import type { Metadata } from 'next';
import { CategoryHero } from '@/components/CategoryHero';
import { EducationGrid } from './EducationGrid';

export const revalidate = 3600;

export const metadata: Metadata = { title: 'Éducation', description: 'Apprenez la finance, l\'économie et les marchés à votre rythme grâce à nos cours et ressources pédagogiques gratuits.' };

export default function EducationPage() {
  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <CategoryHero
        label="Rubrique"
        title="Éducation"
        description="Apprenez la finance, l'économie et les marchés à votre rythme. Choisissez une catégorie pour commencer."
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <EducationGrid />
      </div>
    </div>
  );
}

import type { Metadata } from 'next';
import { CategoryHero } from '@/components/CategoryHero';
import { PracticalTools } from '@/components/PracticalTools';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Outils Financiers',
  description: 'Simulateurs et calculateurs financiers pour les professionnels au Niger.',
  openGraph: {
    title: 'Outils Financiers',
    description: 'Simulateurs et calculateurs financiers pour les professionnels au Niger.',
    type: 'website',
  },
};

export default function OutilsPage() {
  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <CategoryHero
        label="Rubrique"
        title="Outils Financiers"
        description="Simulateurs et calculateurs financiers optimisés pour le contexte économique africain."
      />
      <PracticalTools />
    </div>
  );
}

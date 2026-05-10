import type { Metadata } from 'next';
import { CategoryHero } from '@/components/CategoryHero';
import { PracticalTools } from '@/components/PracticalTools';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Outils financiers : simulateurs gratuits Niger',
  description: 'Simulateurs et calculateurs financiers gratuits adaptés au Niger et à l\'UEMOA : emprunt, intérêts simples et composés, salaire, budget familial.',
  alternates: { canonical: '/outils' },
  openGraph: {
    title: 'Outils financiers : simulateurs gratuits Niger',
    description: 'Simulateurs et calculateurs financiers gratuits adaptés au Niger et à l\'UEMOA : emprunt, intérêts, salaire, budget familial.',
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

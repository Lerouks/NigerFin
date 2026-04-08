import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SITE_URL } from '@/lib/config';
import { CategoryHero } from '@/components/CategoryHero';
import { NigerPresentation } from '@/components/NigerPresentation';
import { StrategicEnterprisesSection } from '@/components/StrategicEnterprisesSection';
import { NigerSectionSelector } from '../NigerSectionSelector';

// Define all valid sections here — add new ones to scale
const SECTIONS: Record<string, { title: string; description: string; component: React.ComponentType }> = {
  'presentation': {
    title: 'Présentation du Niger',
    description: 'Profil économique, chiffres clés, régions et ressources naturelles du Niger.',
    component: NigerPresentation,
  },
  'entreprises-strategiques': {
    title: 'Entreprises stratégiques du Niger',
    description: 'Les 8 entreprises indispensables de l\'économie nigérienne : mines, énergie, finance, télécoms et agriculture.',
    component: StrategicEnterprisesSection,
  },
};

export function generateStaticParams() {
  return Object.keys(SECTIONS).map((section) => ({ section }));
}

interface NigerSectionPageProps {
  params: Promise<{ section: string }>;
}

export async function generateMetadata({ params }: NigerSectionPageProps): Promise<Metadata> {
  const { section } = await params;
  const config = SECTIONS[section];
  if (!config) return { title: 'Page introuvable' };

  return {
    title: config.title,
    description: config.description,
    alternates: { canonical: `${SITE_URL}/niger/${section}` },
    openGraph: {
      title: config.title,
      description: config.description,
      url: `${SITE_URL}/niger/${section}`,
    },
  };
}

export default async function NigerSectionPage({ params }: NigerSectionPageProps) {
  const { section } = await params;
  const config = SECTIONS[section];

  if (!config) {
    notFound();
  }

  const SectionComponent = config.component;

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <CategoryHero
        label="Découvrir"
        title="Niger"
        description="Profil économique, chiffres clés, ressources naturelles et entreprises stratégiques du Niger."
        accentGold
      />

      <NigerSectionSelector />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <SectionComponent />
      </div>
    </div>
  );
}

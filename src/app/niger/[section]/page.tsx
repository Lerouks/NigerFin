import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SITE_URL } from '@/lib/config';
import { createServiceClient } from '@/lib/supabase';
import { CategoryHero } from '@/components/CategoryHero';
import { NigerPresentation } from '@/components/NigerPresentation';
import { StrategicEnterprisesSection } from '@/components/StrategicEnterprisesSection';
import { NigerSectionSelector } from '../NigerSectionSelector';

// Define all valid sections here — add new ones to scale
const SECTION_KEYS = ['presentation', 'entreprises-strategiques'] as const;

const SECTION_META: Record<string, { title: string; description: string }> = {
  'presentation': {
    title: 'Présentation du Niger',
    description: 'Profil économique, chiffres clés, régions et ressources naturelles du Niger.',
  },
  'entreprises-strategiques': {
    title: 'Entreprises stratégiques du Niger',
    description: 'Les 8 entreprises indispensables de l\'économie nigérienne.',
  },
};

export function generateStaticParams() {
  return SECTION_KEYS.map((section) => ({ section }));
}

interface NigerSectionPageProps {
  params: Promise<{ section: string }>;
}

export async function generateMetadata({ params }: NigerSectionPageProps): Promise<Metadata> {
  const { section } = await params;
  const config = SECTION_META[section];
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

async function getNigerPresentationData() {
  const supabase = createServiceClient();
  if (!supabase) return null;

  const [presentationRes, factsRes, regionsRes, resourcesRes] = await Promise.all([
    supabase.from('niger_presentation').select('*').eq('id', 1).single(),
    supabase.from('niger_country_facts').select('*').eq('is_visible', true).order('display_order', { ascending: true }),
    supabase.from('niger_regions').select('*').eq('is_visible', true).order('name'),
    supabase.from('niger_resources').select('*').eq('is_visible', true).order('economic_importance'),
  ]);

  return {
    presentation: presentationRes.data || null,
    facts: factsRes.data || [],
    regions: regionsRes.data || [],
    resources: resourcesRes.data || [],
  };
}

export default async function NigerSectionPage({ params }: NigerSectionPageProps) {
  const { section } = await params;
  const config = SECTION_META[section];

  if (!config) {
    notFound();
  }

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
        {section === 'presentation' && <NigerPresentationServer />}
        {section === 'entreprises-strategiques' && <StrategicEnterprisesSection />}
      </div>
    </div>
  );
}

/** Server wrapper that pre-fetches data and passes to client component */
async function NigerPresentationServer() {
  const data = await getNigerPresentationData();
  return <NigerPresentation initialData={data} />;
}

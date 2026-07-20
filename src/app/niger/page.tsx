import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/config';
import { createServiceClient } from '@/lib/supabase';
import { CategoryHero } from '@/components/CategoryHero';
import { NigerPresentation } from '@/components/NigerPresentation';
import { MacroIndicatorsBlock } from '@/components/MacroIndicatorsBlock';
import { NIGER_MACRO_INDICATORS, INS_LAST_UPDATE } from '@/data/ins-indicators';
import { NigerSeoBlock } from './NigerSeoBlock';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Niger : profil économique, régions et ressources',
  description: 'Profil économique du Niger : chiffres clés (PIB, population), 7 régions, ressources naturelles (uranium, pétrole, or) et secteurs stratégiques.',
  alternates: { canonical: `${SITE_URL}/niger` },
  openGraph: {
    title: 'Niger : profil économique, régions et ressources',
    description: 'Profil économique du Niger : chiffres clés, régions, ressources naturelles et cadre UEMOA/CEDEAO.',
    url: `${SITE_URL}/niger`,
    type: 'website',
  },
};

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

export default async function NigerPage() {
  const data = await getNigerPresentationData();

  return (
    <div className="min-h-screen bg-background">
      <CategoryHero
        title="Niger"
        description="Profil économique, chiffres clés, régions et ressources naturelles du Niger."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 md:pt-16">
        <NigerPresentation initialData={data} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <MacroIndicatorsBlock
          title="Indicateurs macroéconomiques officiels"
          subtitle="Données INS Niger, Note de Conjoncture T4 2025 et IHPC mensuel. Sources citables, mises à jour à chaque nouvelle publication officielle."
          indicators={NIGER_MACRO_INDICATORS}
          columns={3}
          asOf={INS_LAST_UPDATE}
        />
      </div>

      <NigerSeoBlock />
    </div>
  );
}

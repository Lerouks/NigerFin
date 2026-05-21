'use client';

import { useEffect, useState } from 'react';
import { MapPin, Users, Ruler, Coins, Gem, Factory, Globe, Calendar, TrendingUp, BarChart3 } from 'lucide-react';
import { NigerRegions } from './niger/NigerRegions';
import { NigerResources } from './niger/NigerResources';
import { NigerMapInteractive } from './niger/NigerMapInteractive';
import { useNigerCountry } from '@/hooks/useNigerCountry';
import { useNigerMacro } from '@/hooks/useNigerMacro';

interface Presentation {
  map_image_url: string;
  map_image_alt: string;
  intro_title: string;
  intro_text: string;
}

interface Fact {
  id: string;
  fact_key: string;
  label: string;
  value: string;
  category: string;
  display_order: number;
}

interface Region {
  id: string;
  name: string;
  capital: string;
  population: number;
  area_km2: string;
  economic_activities: string[];
  natural_resources: string[];
  security_level: string;
  security_note: string;
}

interface Resource {
  id: string;
  name: string;
  type: string;
  location_name: string;
  estimated_production: string;
  production_unit: string;
  operating_companies: string[];
  economic_importance: string;
  importance_description: string;
}

const FACT_ICONS: Record<string, typeof MapPin> = {
  capitale: MapPin,
  population: Users,
  superficie: Ruler,
  monnaie: Coins,
  ressources: Gem,
  pib: TrendingUp,
  pib_habitant: BarChart3,
  independance: Calendar,
  langues: Globe,
  langues_nat: Globe,
  idh: BarChart3,
  croissance_demo: Users,
};

const CATEGORY_LABELS: Record<string, string> = {
  general: 'Informations générales',
  economie: 'Économie',
  demographie: 'Démographie',
  geographie: 'Géographie',
};

interface NigerPresentationProps {
  initialData?: {
    presentation: Presentation | null;
    facts: Fact[];
    regions: Region[];
    resources: Resource[];
  } | null;
}

export function NigerPresentation({ initialData }: NigerPresentationProps = {}) {
  const [presentation, setPresentation] = useState<Presentation | null>(initialData?.presentation || null);
  const [facts, setFacts] = useState<Fact[]>(initialData?.facts || []);
  const [regions, setRegions] = useState<Region[]>(initialData?.regions || []);
  const [resources, setResources] = useState<Resource[]>(initialData?.resources || []);
  const [loading, setLoading] = useState(!initialData);

  // Real-time data hooks (these use SWR with deduping, lightweight)
  const countryData = useNigerCountry();
  const macroData = useNigerMacro();

  // Only fetch client-side if no initial data was provided
  useEffect(() => {
    if (initialData) return;
    fetch('/api/niger-presentation')
      .then((res) => res.json())
      .then((data) => {
        setPresentation(data.presentation);
        setFacts(data.facts || []);
        setRegions(data.regions || []);
        setResources(data.resources || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [initialData]);

  // Enrich facts with real-time data (REST Countries + World Bank)
  const enrichedFacts = facts.map((fact) => {
    const enrichments: Record<string, string> = {};

    // REST Countries data (population, area, capital)
    if (countryData.data) {
      if (countryData.data.population) {
        enrichments['population'] = countryData.data.population.toLocaleString('fr-FR');
      }
      if (countryData.data.area) {
        enrichments['superficie'] = `${countryData.data.area.toLocaleString('fr-FR')} km²`;
      }
      if (countryData.data.capital?.[0]) {
        enrichments['capitale'] = countryData.data.capital[0];
      }
    }

    // World Bank data (PIB, PIB/habitant, population) - same source as Indices Economiques
    if (macroData.data) {
      const wb = macroData.data.worldBank;
      const latest = (arr: { value: number | null; year: number }[]) =>
        [...arr].sort((a, b) => b.year - a.year).find((d) => d.value !== null);

      const latestGdp = latest(wb.gdp);
      const latestGdpPc = latest(wb.gdpPerCapita);
      const latestPop = latest(wb.population);

      if (latestGdp?.value) {
        const gdpFcfa = latestGdp.value * 655.957;
        enrichments['pib'] = `${(gdpFcfa / 1e9).toFixed(0)} Mrd FCFA (${latestGdp.year})`;
      }
      if (latestGdpPc?.value) {
        const pcFcfa = latestGdpPc.value * 655.957;
        enrichments['pib_habitant'] = `${Math.round(pcFcfa).toLocaleString('fr-FR')} FCFA (${latestGdpPc.year})`;
      }
      // Use World Bank population (more reliable for economic context)
      if (latestPop?.value) {
        enrichments['population'] = `${(latestPop.value / 1e6).toFixed(1)} millions (${latestPop.year})`;
      }
    }

    const enriched = enrichments[fact.fact_key];
    if (enriched) {
      return { ...fact, value: enriched };
    }
    return fact;
  });

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!presentation) return null;

  // Group facts by category
  const grouped: Record<string, Fact[]> = {};
  for (const fact of enrichedFacts) {
    const cat = fact.category || 'general';
    const bucket = grouped[cat] ?? (grouped[cat] = []);
    bucket.push(fact);
  }

  const categoryOrder = ['general', 'economie', 'demographie', 'geographie'];
  const sortedCategories = categoryOrder.filter((c) => grouped[c]?.length);

  return (
    <div className="space-y-0">
      {/* Profil Pays */}
      <section className="border-t border-black/[0.06] pt-14 md:pt-20">
        <div className="mb-10">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="h-px w-6 bg-gold/60" />
            <span className="text-[11px] tracking-[0.2em] uppercase text-gold font-semibold">Profil pays</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight leading-[1.1]">{presentation.intro_title}</h2>
          {countryData.lastUpdated && (
            <p className="text-[11px] text-gray-500 mt-3">Source : REST Countries &middot; {new Date(countryData.lastUpdated).toLocaleDateString('fr-FR')}</p>
          )}
        </div>

        {/* Texte d'introduction */}
        {presentation.intro_text && (
          <div className="mb-12 max-w-3xl">
            <p className="text-[15px] md:text-base leading-relaxed text-gray-600 whitespace-pre-line">
              {presentation.intro_text}
            </p>
          </div>
        )}

        {/* Carte du Niger custom (PNG public/carte-niger.png) avec tooltips villes au survol */}
        {/* Pas de container card : la PNG est rendue directement sur le fond ivoire,
            mix-blend-mode darken rend le fond blanc de la PNG transparent. */}
        <div className="mb-14">
          <NigerMapInteractive />
          <p className="text-[11px] text-gray-500 mt-3 text-center">
            Survolez une ville pour afficher son rôle. Source : NFI Report.
          </p>
        </div>

        {/* Données clés */}
        <div className="space-y-10">
          {sortedCategories.map((cat) => (
            <div key={cat}>
              <h3 className="text-[11px] tracking-[0.15em] uppercase text-gray-600 font-semibold mb-4 pb-2 border-b border-black/[0.06]">
                {CATEGORY_LABELS[cat] || cat}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(grouped[cat] ?? []).map((fact) => {
                  const Icon = FACT_ICONS[fact.fact_key] || Factory;
                  return (
                    <div
                      key={fact.id}
                      className="group flex items-start gap-3.5 p-5 rounded-xl bg-white border border-black/[0.06] hover:border-black/[0.1] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <div className="w-9 h-9 rounded-lg bg-[#fafaf9] border border-black/[0.06] flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-[#111] group-hover:border-[#111] transition-colors duration-200">
                        <Icon className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors duration-200" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">{fact.label}</p>
                        <p className="text-[14px] font-semibold text-gray-900 leading-snug">{fact.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

      </section>

      {/* Régions */}
      <NigerRegions regions={regions} />

      {/* Ressources */}
      <NigerResources resources={resources} />
    </div>
  );
}

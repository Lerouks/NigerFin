'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { MapPin, Users, Ruler, Coins, Gem, Factory, Globe, Calendar, TrendingUp, BarChart3 } from 'lucide-react';
import { NigerRegions } from './niger/NigerRegions';
import { NigerResources } from './niger/NigerResources';
import { NigerIndicators } from './niger/NigerIndicators';

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

export function NigerPresentation() {
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [facts, setFacts] = useState<Fact[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [regions, setRegions] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [resources, setResources] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [indicators, setIndicators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/niger-presentation')
      .then((res) => res.json())
      .then((data) => {
        setPresentation(data.presentation);
        setFacts(data.facts || []);
        setRegions(data.regions || []);
        setResources(data.resources || []);
        setIndicators(data.indicators || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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
  for (const fact of facts) {
    const cat = fact.category || 'general';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(fact);
  }

  const categoryOrder = ['general', 'economie', 'demographie', 'geographie'];
  const sortedCategories = categoryOrder.filter((c) => grouped[c]?.length);

  return (
    <div className="space-y-0">
      {/* Profil Pays */}
      <section className="border-t border-black/[0.06] pt-14 md:pt-20">
        <div className="mb-10">
          <span className="text-[11px] tracking-[0.2em] uppercase text-gray-400 block mb-3">Profil pays</span>
          <h2 className="text-2xl md:text-3xl leading-tight">{presentation.intro_title}</h2>
        </div>

        {/* Texte d'introduction */}
        {presentation.intro_text && (
          <div className="mb-12 max-w-3xl">
            <p className="text-[15px] md:text-base leading-relaxed text-gray-600 whitespace-pre-line">
              {presentation.intro_text}
            </p>
          </div>
        )}

        {/* Carte pleine largeur */}
        <div className="mb-14">
          {presentation.map_image_url ? (
            <div className="rounded-xl overflow-hidden bg-[#f5f5f0] border border-black/[0.06]">
              <Image
                src={presentation.map_image_url}
                alt={presentation.map_image_alt || 'Carte administrative du Niger'}
                width={1320}
                height={916}
                className="w-full h-auto block"
                priority
                sizes="(max-width: 1280px) 100vw, 1200px"
              />
            </div>
          ) : (
            <div className="rounded-xl bg-[#f5f5f0] border border-black/[0.06] aspect-[1320/916] flex items-center justify-center">
              <div className="text-center text-gray-400">
                <MapPin className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-[13px]">Carte du Niger</p>
              </div>
            </div>
          )}
          <p className="text-[11px] text-gray-400 mt-3 text-center">
            Carte administrative du Niger &mdash; Source : Ministère des Affaires étrangères / NFI Report
          </p>
        </div>

        {/* Données clés */}
        <div className="space-y-10">
          {sortedCategories.map((cat) => (
            <div key={cat}>
              <h3 className="text-[11px] tracking-[0.15em] uppercase text-gray-400 mb-4 pb-2 border-b border-black/[0.06]">
                {CATEGORY_LABELS[cat] || cat}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {grouped[cat].map((fact) => {
                  const Icon = FACT_ICONS[fact.fact_key] || Factory;
                  return (
                    <div
                      key={fact.id}
                      className="group flex items-start gap-3.5 p-5 rounded-xl bg-white border border-black/[0.06] hover:border-black/[0.1] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <div className="w-9 h-9 rounded-lg bg-[#fafaf9] border border-black/[0.06] flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-[#111] group-hover:border-[#111] transition-colors duration-200">
                        <Icon className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors duration-200" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">{fact.label}</p>
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

      {/* Indicateurs économiques */}
      <NigerIndicators indicators={indicators} />

      {/* Régions */}
      <NigerRegions regions={regions} />

      {/* Ressources */}
      <NigerResources resources={resources} />
    </div>
  );
}

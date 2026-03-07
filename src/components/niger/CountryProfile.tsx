'use client';

import { Globe, Users, MapPin, Languages, Coins, BarChart3, Calendar, Mountain, Handshake } from 'lucide-react';

interface Fact {
  id: string;
  fact_key: string;
  label: string;
  value: string;
  category: string;
  display_order: number;
}

interface Partner {
  id: string;
  name: string;
  country_code: string;
  type: string;
  description: string;
}

interface CountryProfileProps {
  facts: Fact[];
  partners: Partner[];
}

const FACT_ICONS: Record<string, typeof Globe> = {
  population: Users,
  capitale: MapPin,
  superficie: Mountain,
  langues: Languages,
  langues_nat: Languages,
  monnaie: Coins,
  pib: BarChart3,
  pib_habitant: BarChart3,
  independance: Calendar,
  ressources: Globe,
  idh: BarChart3,
  croissance_demo: Users,
};

const CATEGORY_COLORS: Record<string, string> = {
  general: 'bg-gray-50 border-gray-100',
  economie: 'bg-blue-50 border-blue-100',
  demographie: 'bg-emerald-50 border-emerald-100',
  geographie: 'bg-amber-50 border-amber-100',
};

const PARTNER_TYPES: Record<string, { label: string; color: string }> = {
  export: { label: 'Export', color: 'bg-emerald-100 text-emerald-700' },
  import: { label: 'Import', color: 'bg-blue-100 text-blue-700' },
  investissement: { label: 'Investissement', color: 'bg-purple-100 text-purple-700' },
  aide: { label: 'Aide', color: 'bg-amber-100 text-amber-700' },
};

export function CountryProfile({ facts, partners }: CountryProfileProps) {
  const categories = Array.from(new Set(facts.map((f) => f.category)));

  return (
    <div className="space-y-8">
      {/* Country Identity Card */}
      <div className="bg-white rounded-2xl border border-black/[0.06] overflow-hidden">
        <div className="bg-[#111] text-white px-6 py-5">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Carte d&apos;identité du Niger
          </h3>
          <p className="text-white/50 text-[13px] mt-1">Données clés actualisées</p>
        </div>

        <div className="p-5">
          {categories.map((cat) => (
            <div key={cat} className="mb-4 last:mb-0">
              <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium mb-2">
                {cat === 'general' ? 'Général' : cat === 'economie' ? 'Économie' : cat === 'demographie' ? 'Démographie' : 'Géographie'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {facts
                  .filter((f) => f.category === cat)
                  .map((fact) => {
                    const Icon = FACT_ICONS[fact.fact_key] || Globe;
                    return (
                      <div
                        key={fact.id}
                        className={`flex items-start gap-3 p-3 rounded-xl border ${CATEGORY_COLORS[cat] || CATEGORY_COLORS.general}`}
                      >
                        <Icon className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[11px] text-gray-400">{fact.label}</p>
                          <p className="font-semibold text-[14px] text-gray-900 break-words">{fact.value}</p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Partners */}
      {partners.length > 0 && (
        <div className="bg-white rounded-2xl border border-black/[0.06] p-6">
          <div className="flex items-center gap-2 mb-5">
            <Handshake className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-bold">Partenaires économiques</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {partners.map((p) => {
              const pType = PARTNER_TYPES[p.type] || PARTNER_TYPES.export;
              return (
                <div key={p.id} className="p-4 bg-[#fafaf9] rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-[14px]">{p.name}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${pType.color}`}>
                      {pType.label}
                    </span>
                  </div>
                  <p className="text-[12px] text-gray-500 leading-relaxed">{p.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

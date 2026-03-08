'use client';

import { useState } from 'react';
import { MapPin, Users, Pickaxe, Briefcase, Shield } from 'lucide-react';

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

const SECURITY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  stable: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Stable' },
  moderate: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Modere' },
  elevated: { bg: 'bg-orange-50', text: 'text-orange-700', label: 'Vigilance' },
  critical: { bg: 'bg-red-50', text: 'text-red-700', label: 'Critique' },
};

export function NigerRegions({ regions }: { regions: Region[] }) {
  const [selected, setSelected] = useState<string | null>(null);

  if (!regions.length) return null;

  const selectedRegion = regions.find((r) => r.id === selected);

  return (
    <section className="border-t border-black/[0.06] pt-14 md:pt-20">
      <div className="mb-10">
        <span className="text-[11px] tracking-[0.2em] uppercase text-gray-400 block mb-3">Geographie</span>
        <h2 className="text-2xl md:text-3xl leading-tight">Regions du Niger</h2>
        <p className="text-[15px] text-gray-500 mt-2">8 regions aux profils economiques distincts</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {regions.map((region) => {
          const isSelected = selected === region.id;
          return (
            <button
              key={region.id}
              onClick={() => setSelected(isSelected ? null : region.id)}
              className={`text-left p-4 rounded-xl border transition-all ${
                isSelected
                  ? 'border-black/20 bg-[#111] text-white shadow-lg'
                  : 'border-black/[0.06] bg-white hover:border-black/10 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-white/60' : 'text-gray-400'}`} />
                <span className="text-[13px] font-medium">{region.name}</span>
              </div>
              <p className={`text-[11px] ${isSelected ? 'text-white/50' : 'text-gray-400'}`}>
                {(region.population / 1_000_000).toFixed(1)}M hab.
              </p>
            </button>
          );
        })}
      </div>

      {selectedRegion && (
        <div className="bg-white rounded-xl border border-black/[0.06] p-6 md:p-8 animate-in fade-in duration-200">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-xl font-medium">{selectedRegion.name}</h3>
              <p className="text-[13px] text-gray-400 mt-1">Capitale : {selectedRegion.capital}</p>
            </div>
            {SECURITY_STYLES[selectedRegion.security_level] && (
              <span className={`text-[11px] px-3 py-1 rounded-full font-medium ${SECURITY_STYLES[selectedRegion.security_level].bg} ${SECURITY_STYLES[selectedRegion.security_level].text}`}>
                <Shield className="w-3 h-3 inline mr-1" />
                {SECURITY_STYLES[selectedRegion.security_level].label}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-[11px] uppercase tracking-wider text-gray-400">Population & Superficie</span>
              </div>
              <p className="text-[14px] text-gray-900 font-medium">{selectedRegion.population.toLocaleString('fr-FR')} hab.</p>
              <p className="text-[13px] text-gray-500 mt-1">{Number(selectedRegion.area_km2).toLocaleString('fr-FR')} km²</p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-[11px] uppercase tracking-wider text-gray-400">Activites</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedRegion.economic_activities.map((a) => (
                  <span key={a} className="text-[12px] px-2.5 py-1 rounded-full bg-gray-50 border border-black/[0.04] text-gray-600">{a}</span>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Pickaxe className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-[11px] uppercase tracking-wider text-gray-400">Ressources</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedRegion.natural_resources.length > 0 ? (
                  selectedRegion.natural_resources.map((r) => (
                    <span key={r} className="text-[12px] px-2.5 py-1 rounded-full bg-amber-50 border border-amber-100 text-amber-700">{r}</span>
                  ))
                ) : (
                  <span className="text-[12px] text-gray-400">-</span>
                )}
              </div>
            </div>
          </div>

          {selectedRegion.security_note && (
            <p className="text-[12px] text-gray-400 mt-5 pt-4 border-t border-black/[0.04]">
              {selectedRegion.security_note}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

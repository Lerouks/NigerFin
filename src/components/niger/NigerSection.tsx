'use client';

import { useState, useEffect } from 'react';
import { Map, Gem, BarChart3, BookOpen, Loader2 } from 'lucide-react';
import { NigerMap } from './NigerMap';
import { ResourceTracker } from './ResourceTracker';
import { EconomicDashboard } from './EconomicDashboard';
import { CountryProfile } from './CountryProfile';

type Tab = 'carte' | 'ressources' | 'economie' | 'profil';

const TABS: { id: Tab; label: string; icon: typeof Map }[] = [
  { id: 'carte',      label: 'Carte interactive',  icon: Map },
  { id: 'ressources', label: 'Ressources',         icon: Gem },
  { id: 'economie',   label: 'Économie',            icon: BarChart3 },
  { id: 'profil',     label: 'Le Niger en 5 min',  icon: BookOpen },
];

const MAP_FILTERS = [
  { id: 'default',     label: 'Vue générale' },
  { id: 'securite',    label: 'Sécurité' },
  { id: 'ressources',  label: 'Ressources' },
  { id: 'demographie', label: 'Démographie' },
  { id: 'economie',    label: 'Économie' },
];

/* eslint-disable @typescript-eslint/no-explicit-any */
interface NigerData {
  regions: any[];
  resources: any[];
  resourceHistory: any[];
  indicators: any[];
  indicatorHistory: any[];
  facts: any[];
  partners: any[];
}

export function NigerSection() {
  const [tab, setTab] = useState<Tab>('carte');
  const [mapFilter, setMapFilter] = useState('default');
  const [data, setData] = useState<NigerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/niger')
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-gray-500">
        Impossible de charger les données.
      </div>
    );
  }

  return (
    <div>
      {/* Tab navigation */}
      <div className="flex overflow-x-auto gap-1 bg-white rounded-xl border border-black/[0.06] p-1.5 mb-6 no-scrollbar">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[#111] text-white'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {tab === 'carte' && (
        <div>
          {/* Map filters */}
          <div className="flex flex-wrap gap-2 mb-5">
            {MAP_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setMapFilter(f.id)}
                className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all ${
                  mapFilter === f.id
                    ? 'bg-[#111] text-white'
                    : 'bg-white border border-black/[0.08] text-gray-500 hover:border-black/20'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <NigerMap regions={data.regions} filter={mapFilter} />
        </div>
      )}

      {tab === 'ressources' && (
        <ResourceTracker resources={data.resources} resourceHistory={data.resourceHistory} />
      )}

      {tab === 'economie' && (
        <EconomicDashboard indicators={data.indicators} indicatorHistory={data.indicatorHistory} />
      )}

      {tab === 'profil' && (
        <CountryProfile facts={data.facts} partners={data.partners} />
      )}
    </div>
  );
}

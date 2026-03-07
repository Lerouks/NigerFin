'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Factory, MapPin, TrendingUp } from 'lucide-react';

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
  niger_regions?: { name: string };
}

interface ResourceHistory {
  resource_id: string;
  year: number;
  production: number;
  unit: string;
  niger_resources?: { name: string; type: string };
}

interface ResourceTrackerProps {
  resources: Resource[];
  resourceHistory: ResourceHistory[];
}

const TYPE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  uranium:  { label: 'Uranium',  color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
  petrole:  { label: 'Pétrole',  color: 'text-gray-700',   bg: 'bg-gray-50 border-gray-200' },
  or:       { label: 'Or',       color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200' },
  charbon:  { label: 'Charbon',  color: 'text-stone-700',  bg: 'bg-stone-50 border-stone-200' },
  autre:    { label: 'Autre',    color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200' },
};

const IMPORTANCE_LABELS: Record<string, string> = {
  critique: 'Critique',
  majeure:  'Majeure',
  moderee:  'Modérée',
  mineure:  'Mineure',
};

const CHART_COLORS: Record<string, string> = {
  uranium: '#eab308',
  petrole: '#111',
  or: '#f59e0b',
  charbon: '#78716c',
  autre: '#3b82f6',
};

export function ResourceTracker({ resources, resourceHistory }: ResourceTrackerProps) {
  const types = ['all', ...Object.keys(TYPE_LABELS)];
  const [activeType, setActiveType] = useState('all');
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  const filtered = activeType === 'all' ? resources : resources.filter((r) => r.type === activeType);

  const historyForResource = selectedResource
    ? resourceHistory
        .filter((h) => h.resource_id === selectedResource.id)
        .map((h) => ({ year: h.year, production: Number(h.production) }))
    : [];

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {types.map((t) => (
          <button
            key={t}
            onClick={() => { setActiveType(t); setSelectedResource(null); }}
            className={`px-4 py-2 rounded-full text-[13px] font-medium transition-all ${
              activeType === t
                ? 'bg-[#111] text-white'
                : 'bg-white border border-black/[0.08] text-gray-600 hover:border-black/20'
            }`}
          >
            {t === 'all' ? 'Toutes' : TYPE_LABELS[t]?.label || t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Resource cards */}
        {filtered.map((r) => {
          const typeInfo = TYPE_LABELS[r.type] || TYPE_LABELS.autre;
          const isSelected = selectedResource?.id === r.id;

          return (
            <button
              key={r.id}
              onClick={() => setSelectedResource(isSelected ? null : r)}
              className={`text-left p-5 rounded-xl border-2 transition-all ${
                isSelected ? 'border-[#111] bg-[#111]/[0.02]' : 'border-black/[0.06] hover:border-black/15 bg-white'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-[15px]">{r.name}</h4>
                  <div className="flex items-center gap-1.5 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-[12px] text-gray-500">{r.location_name}</span>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${typeInfo.bg} ${typeInfo.color}`}>
                  {typeInfo.label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-[#fafaf9] rounded-lg p-2.5">
                  <p className="text-[11px] text-gray-400 mb-0.5">Production</p>
                  <p className="font-semibold text-[14px]">{r.estimated_production}</p>
                  <p className="text-[11px] text-gray-400">{r.production_unit}</p>
                </div>
                <div className="bg-[#fafaf9] rounded-lg p-2.5">
                  <p className="text-[11px] text-gray-400 mb-0.5">Importance</p>
                  <p className="font-semibold text-[14px]">{IMPORTANCE_LABELS[r.economic_importance] || r.economic_importance}</p>
                </div>
              </div>

              {r.operating_companies?.length > 0 && (
                <div className="flex items-center gap-1.5 mb-2">
                  <Factory className="w-3.5 h-3.5 text-gray-400" />
                  <p className="text-[12px] text-gray-500 truncate">{r.operating_companies.join(', ')}</p>
                </div>
              )}

              {r.importance_description && (
                <p className="text-[12px] text-gray-500 leading-relaxed line-clamp-2">{r.importance_description}</p>
              )}
            </button>
          );
        })}
      </div>

      {/* Production chart */}
      {selectedResource && historyForResource.length > 0 && (
        <div className="mt-6 bg-white rounded-xl border border-black/[0.06] p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-gray-500" />
            <h4 className="font-semibold text-[15px]">
              Évolution de la production — {selectedResource.name}
            </h4>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historyForResource} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: '#111', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                  labelStyle={{ color: '#999' }}
                  formatter={(value) => [Number(value).toLocaleString('fr-FR'), 'Production']}
                />
                <Bar dataKey="production" fill={CHART_COLORS[selectedResource.type] || '#111'} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { Atom, Droplets, CircleDot, Flame, Factory } from 'lucide-react';

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

const TYPE_CONFIG: Record<string, { icon: typeof Atom; color: string; bg: string }> = {
  uranium: { icon: Atom, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  petrole: { icon: Droplets, color: 'text-blue-600', bg: 'bg-blue-50' },
  or: { icon: CircleDot, color: 'text-amber-600', bg: 'bg-amber-50' },
  charbon: { icon: Flame, color: 'text-orange-600', bg: 'bg-orange-50' },
  autre: { icon: Factory, color: 'text-gray-600', bg: 'bg-gray-50' },
};

const IMPORTANCE_LABELS: Record<string, { label: string; style: string }> = {
  critique: { label: 'Critique', style: 'bg-red-50 text-red-700 border-red-100' },
  majeure: { label: 'Majeure', style: 'bg-amber-50 text-amber-700 border-amber-100' },
  moderee: { label: 'Moderee', style: 'bg-blue-50 text-blue-700 border-blue-100' },
};

export function NigerResources({ resources }: { resources: Resource[] }) {
  if (!resources.length) return null;

  return (
    <section className="border-t border-black/[0.06] pt-14 md:pt-20">
      <div className="mb-10">
        <span className="text-[11px] tracking-[0.2em] uppercase text-gray-400 block mb-3">Richesses naturelles</span>
        <h2 className="text-2xl md:text-3xl leading-tight">Ressources strategiques</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {resources.map((resource) => {
          const config = TYPE_CONFIG[resource.type] || TYPE_CONFIG.autre;
          const Icon = config.icon;
          const importance = IMPORTANCE_LABELS[resource.economic_importance];

          return (
            <div
              key={resource.id}
              className="bg-white rounded-xl border border-black/[0.06] p-5 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>
                {importance && (
                  <span className={`text-[10px] px-2.5 py-1 rounded-full border font-medium ${importance.style}`}>
                    {importance.label}
                  </span>
                )}
              </div>

              <h3 className="text-[15px] font-medium mb-1">{resource.name}</h3>
              <p className="text-[12px] text-gray-400 mb-4">{resource.location_name}</p>

              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">Production estimee</p>
                <p className="text-[15px] font-medium text-gray-900">
                  {resource.estimated_production} <span className="text-[12px] text-gray-400 font-normal">{resource.production_unit}</span>
                </p>
              </div>

              <p className="text-[13px] text-gray-500 leading-relaxed mb-3">{resource.importance_description}</p>

              <div className="flex flex-wrap gap-1.5">
                {resource.operating_companies.map((company) => (
                  <span key={company} className="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-500">{company}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

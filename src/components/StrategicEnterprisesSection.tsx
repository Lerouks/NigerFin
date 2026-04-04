'use client';

import { useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';

interface Enterprise {
  id: string;
  name: string;
  sector: string;
  description: string;
  logo_url: string | null;
  image_url: string | null;
}

// Sector → accent color mapping
const SECTOR_COLORS: Record<string, string> = {
  'Mines & Uranium': 'bg-amber-50 text-amber-700 border-amber-200',
  'Mines & Ressources': 'bg-orange-50 text-orange-700 border-orange-200',
  'Pétrole & Énergie': 'bg-red-50 text-red-700 border-red-200',
  'Électricité & Énergie': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  'Télécommunications': 'bg-blue-50 text-blue-700 border-blue-200',
  'Banque & Finance': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Agriculture & Agroalimentaire': 'bg-green-50 text-green-700 border-green-200',
  'Transport & Logistique': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'BTP & Infrastructures': 'bg-slate-50 text-slate-700 border-slate-200',
};

const DEFAULT_COLOR = 'bg-gray-50 text-gray-700 border-gray-200';

export function StrategicEnterprisesSection() {
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/strategic-enterprises')
      .then((r) => (r.ok ? r.json() : []))
      .then(setEnterprises)
      .catch(() => setEnterprises([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (enterprises.length === 0) return null;

  return (
    <section className="border-t border-black/[0.04] pt-14 md:pt-20">
      {/* Section header */}
      <div className="mb-10">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-lg bg-[#111] flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <span className="text-[12px] font-semibold tracking-[0.1em] uppercase text-gray-400">
            Acteurs clés
          </span>
        </div>
        <h2 className="text-[28px] sm:text-[32px] font-bold text-gray-900 leading-tight">
          Entreprises stratégiques du Niger
        </h2>
        <p className="text-[15px] text-gray-500 mt-2 max-w-2xl">
          Les piliers de l&apos;économie nigérienne : mines, énergie, finance, télécoms et agriculture.
        </p>
      </div>

      {/* Enterprise grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {enterprises.map((enterprise) => {
          const colorClass = SECTOR_COLORS[enterprise.sector] || DEFAULT_COLOR;
          return (
            <article
              key={enterprise.id}
              className="group bg-white border border-black/[0.06] rounded-2xl overflow-hidden hover:shadow-lg hover:border-black/[0.1] transition-all duration-300"
            >
              {/* Image banner */}
              {enterprise.image_url ? (
                <div className="h-40 overflow-hidden">
                  <img
                    src={enterprise.image_url}
                    alt={enterprise.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              ) : (
                <div className="h-2 bg-gradient-to-r from-[#111] to-[#333]" />
              )}

              <div className="p-6">
                {/* Logo + name */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#f5f5f0] flex items-center justify-center flex-shrink-0 border border-black/[0.04]">
                    {enterprise.logo_url ? (
                      <img
                        src={enterprise.logo_url}
                        alt={`Logo ${enterprise.name}`}
                        className="w-8 h-8 object-contain"
                      />
                    ) : (
                      <span className="text-[18px] font-bold text-gray-400">
                        {enterprise.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[17px] font-bold text-gray-900 leading-tight group-hover:text-[#111] transition-colors">
                      {enterprise.name}
                    </h3>
                    <span className={`inline-block mt-1.5 px-2.5 py-0.5 text-[11px] font-medium rounded-full border ${colorClass}`}>
                      {enterprise.sector}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-[13px] leading-relaxed text-gray-500">
                  {enterprise.description}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

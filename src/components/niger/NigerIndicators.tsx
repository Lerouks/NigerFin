'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Indicator {
  id: string;
  indicator_key: string;
  label: string;
  value: string;
  previous_value: string;
  unit: string;
  category: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  macro: 'Indicateurs macroeconomiques',
  prix: 'Prix a la consommation',
  change: 'Taux de change',
};

export function NigerIndicators({ indicators }: { indicators: Indicator[] }) {
  if (!indicators.length) return null;

  const grouped: Record<string, Indicator[]> = {};
  for (const ind of indicators) {
    const cat = ind.category || 'macro';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(ind);
  }

  const categoryOrder = ['macro', 'prix', 'change'];

  return (
    <section className="border-t border-black/[0.06] pt-14 md:pt-20">
      <div className="mb-10">
        <span className="text-[11px] tracking-[0.2em] uppercase text-gray-400 block mb-3">Conjoncture</span>
        <h2 className="text-2xl md:text-3xl leading-tight">Indicateurs economiques</h2>
      </div>

      <div className="space-y-8">
        {categoryOrder.filter((c) => grouped[c]?.length).map((cat) => (
          <div key={cat}>
            <h3 className="text-[11px] tracking-[0.15em] uppercase text-gray-400 mb-4 pb-2 border-b border-black/[0.06]">
              {CATEGORY_LABELS[cat] || cat}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {grouped[cat].map((ind) => {
                const current = parseFloat(ind.value);
                const previous = parseFloat(ind.previous_value);
                const diff = current - previous;
                const isUp = diff > 0;
                const isDown = diff < 0;
                const isStable = diff === 0;

                return (
                  <div
                    key={ind.id}
                    className="bg-white rounded-xl border border-black/[0.06] p-4 hover:shadow-sm transition-shadow"
                  >
                    <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-3">{ind.label}</p>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-2xl font-medium text-gray-900 leading-none">
                          {ind.value}
                        </p>
                        <p className="text-[12px] text-gray-400 mt-1">{ind.unit}</p>
                      </div>
                      <div className={`flex items-center gap-1 text-[12px] font-medium ${
                        isUp ? 'text-emerald-600' : isDown ? 'text-red-500' : 'text-gray-400'
                      }`}>
                        {isUp && <TrendingUp className="w-3.5 h-3.5" />}
                        {isDown && <TrendingDown className="w-3.5 h-3.5" />}
                        {isStable && <Minus className="w-3.5 h-3.5" />}
                        <span>{isStable ? '0' : (isUp ? '+' : '') + diff.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

'use client';

import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Indicator {
  id: string;
  indicator_key: string;
  label: string;
  value: number;
  previous_value: number | null;
  unit: string;
  category: string;
  display_order: number;
}

interface IndicatorHistory {
  indicator_id: string;
  date: string;
  value: number;
  niger_economic_indicators?: { indicator_key: string; label: string };
}

interface EconomicDashboardProps {
  indicators: Indicator[];
  indicatorHistory: IndicatorHistory[];
}

const CATEGORY_LABELS: Record<string, string> = {
  macro: 'Macroéconomie',
  prix: 'Prix',
  change: 'Change',
};

function getTrend(current: number, previous: number | null) {
  if (previous === null) return { direction: 'flat' as const, percent: 0 };
  const diff = current - previous;
  const percent = previous !== 0 ? (diff / previous) * 100 : 0;
  if (diff > 0) return { direction: 'up' as const, percent };
  if (diff < 0) return { direction: 'down' as const, percent };
  return { direction: 'flat' as const, percent: 0 };
}

function formatValue(value: number, unit: string): string {
  if (unit === '%') return `${value.toLocaleString('fr-FR', { minimumFractionDigits: 1 })}%`;
  if (unit.includes('FCFA')) return `${value.toLocaleString('fr-FR')} ${unit}`;
  return `${value.toLocaleString('fr-FR')} ${unit}`;
}

export function EconomicDashboard({ indicators, indicatorHistory }: EconomicDashboardProps) {
  const [selectedIndicator, setSelectedIndicator] = useState<Indicator | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = ['all'].concat(Array.from(new Set(indicators.map((i) => i.category))));
  const filtered = activeCategory === 'all' ? indicators : indicators.filter((i) => i.category === activeCategory);

  const historyForIndicator = selectedIndicator
    ? indicatorHistory
        .filter((h) => h.indicator_id === selectedIndicator.id)
        .map((h) => ({
          date: new Date(h.date).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
          value: Number(h.value),
        }))
    : [];

  return (
    <div>
      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => { setActiveCategory(c); setSelectedIndicator(null); }}
            className={`px-4 py-2 rounded-full text-[13px] font-medium transition-all ${
              activeCategory === c
                ? 'bg-[#111] text-white'
                : 'bg-white border border-black/[0.08] text-gray-600 hover:border-black/20'
            }`}
          >
            {c === 'all' ? 'Tous' : CATEGORY_LABELS[c] || c}
          </button>
        ))}
      </div>

      {/* Indicator cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {filtered.map((ind) => {
          const trend = getTrend(ind.value, ind.previous_value);
          const isSelected = selectedIndicator?.id === ind.id;
          const hasHistory = indicatorHistory.some((h) => h.indicator_id === ind.id);

          return (
            <button
              key={ind.id}
              onClick={() => hasHistory && setSelectedIndicator(isSelected ? null : ind)}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                isSelected
                  ? 'border-[#111] bg-[#111]/[0.02]'
                  : 'border-black/[0.06] bg-white hover:border-black/15'
              } ${hasHistory ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <p className="text-[12px] text-gray-400 mb-1 truncate">{ind.label}</p>
              <p className="text-xl font-bold mb-1">{formatValue(ind.value, ind.unit)}</p>
              {ind.previous_value !== null && (
                <div className={`flex items-center gap-1 text-[12px] font-medium ${
                  trend.direction === 'up' ? 'text-emerald-600' : trend.direction === 'down' ? 'text-red-500' : 'text-gray-400'
                }`}>
                  {trend.direction === 'up' && <TrendingUp className="w-3.5 h-3.5" />}
                  {trend.direction === 'down' && <TrendingDown className="w-3.5 h-3.5" />}
                  {trend.direction === 'flat' && <Minus className="w-3.5 h-3.5" />}
                  <span>{trend.percent > 0 ? '+' : ''}{trend.percent.toFixed(1)}%</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* History chart */}
      {selectedIndicator && historyForIndicator.length > 0 && (
        <div className="mt-6 bg-white rounded-xl border border-black/[0.06] p-5">
          <h4 className="font-semibold text-[15px] mb-4">
            Évolution : {selectedIndicator.label}
          </h4>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyForIndicator} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#111" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#111" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ background: '#111', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                  labelStyle={{ color: '#999' }}
                  formatter={(value) => [formatValue(Number(value), selectedIndicator.unit), selectedIndicator.label]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#111"
                  strokeWidth={2}
                  fill="url(#areaGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

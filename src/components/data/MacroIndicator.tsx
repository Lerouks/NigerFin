'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MacroIndicatorProps {
  label: string;
  value: number | string;
  previousValue?: number | string;
  unit?: string;
  source?: string | null;
  lastUpdated?: string | null;
}

export function MacroIndicator({ label, value, previousValue, unit, source, lastUpdated }: MacroIndicatorProps) {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  const numPrev = previousValue !== undefined ? (typeof previousValue === 'string' ? parseFloat(previousValue) : previousValue) : null;

  const diff = numPrev !== null ? numValue - numPrev : 0;
  const isUp = diff > 0;
  const isDown = diff < 0;

  const formatValue = (v: number) => {
    if (Math.abs(v) >= 1e9) return `${(v / 1e9).toFixed(1)} Mds`;
    if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(1)} M`;
    return v.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
  };

  return (
    <div className="group bg-white rounded-xl border border-black/[0.06] p-5 hover:border-black/[0.1] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-3">{label}</p>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-semibold text-gray-900 leading-none">
            {typeof value === 'string' ? value : formatValue(numValue)}
          </p>
          {unit && <p className="text-[12px] text-gray-400 mt-1">{unit}</p>}
        </div>
        {numPrev !== null && (
          <div
            className={`flex items-center gap-1 text-[12px] font-medium ${
              isUp ? 'text-emerald-600' : isDown ? 'text-red-500' : 'text-gray-400'
            }`}
          >
            {isUp && <TrendingUp className="w-3.5 h-3.5" />}
            {isDown && <TrendingDown className="w-3.5 h-3.5" />}
            {!isUp && !isDown && <Minus className="w-3.5 h-3.5" />}
            <span>{diff === 0 ? '0' : `${isUp ? '+' : ''}${diff.toFixed(1)}`}</span>
          </div>
        )}
      </div>
      {(source || lastUpdated) && (
        <div className="mt-3 pt-2 border-t border-black/[0.04] flex items-center justify-between">
          {source && <span className="text-[10px] text-gray-400">{source}</span>}
          {lastUpdated && (
            <span className="text-[10px] text-gray-400">
              {new Date(lastUpdated).toLocaleDateString('fr-FR')}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import type { ForexRate } from '@/lib/services/frankfurter-service';

interface ForexTickerProps {
  rates: ForexRate[];
  source?: string | null;
  lastUpdated?: string | null;
}

export function ForexTicker({ rates, source, lastUpdated }: ForexTickerProps) {
  if (!rates.length) return null;

  return (
    <div className="bg-white rounded-xl border border-black/[0.06] overflow-hidden">
      <div className="px-5 py-4 border-b border-black/[0.05] flex items-center justify-between">
        <h3 className="text-[15px] font-semibold">Taux de change XOF</h3>
        {source && (
          <span className="text-[10px] text-gray-400 bg-[#f5f5f0] px-2 py-0.5 rounded-full">
            {source}
          </span>
        )}
      </div>
      <div className="divide-y divide-black/[0.04]">
        {rates.map((rate) => (
          <div
            key={`${rate.base}/${rate.target}`}
            className="flex items-center justify-between px-5 py-3.5 hover:bg-[#fafaf9] transition-colors"
          >
            <div className="flex-1">
              <span className="text-[14px] font-medium">{rate.base}/XOF</span>
            </div>
            <div className="flex items-center gap-5">
              <span className="text-[14px] font-semibold tabular-nums">
                {rate.rateInXOF.toLocaleString('fr-FR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <div
                className={`flex items-center gap-1 min-w-[70px] justify-end text-[12px] font-medium ${
                  rate.changePercent >= 0 ? 'text-emerald-600' : 'text-red-500'
                }`}
              >
                {rate.changePercent >= 0 ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                {rate.changePercent > 0 ? '+' : ''}
                {rate.changePercent.toFixed(3)}%
              </div>
            </div>
          </div>
        ))}
      </div>
      {lastUpdated && (
        <div className="px-5 py-2.5 border-t border-black/[0.04] bg-[#fafaf9]">
          <p className="text-[10px] text-gray-400 text-center">
            Mis à jour : {new Date(lastUpdated).toLocaleString('fr-FR', {
              day: '2-digit', month: '2-digit', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>
      )}
    </div>
  );
}

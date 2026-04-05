'use client';

import type { BRVMStock } from '@/lib/services/brvm-scraper-service';
import { VariationBadge } from './VariationBadge';

interface BRVMCardProps {
  stock: BRVMStock;
}

export function BRVMCard({ stock }: BRVMCardProps) {
  return (
    <div className="group bg-white rounded-xl border border-black/[0.06] p-5 hover:border-black/[0.1] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[14px] font-semibold">{stock.ticker}</p>
          <p className="text-[12px] text-gray-400 mt-0.5">{stock.name}</p>
        </div>
        {stock.country && (
          <span className="text-[10px] text-gray-400 bg-[#f5f5f0] px-2 py-0.5 rounded-full">
            {stock.country}
          </span>
        )}
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-semibold text-gray-900 leading-none tabular-nums">
            {stock.price > 0
              ? stock.price.toLocaleString('fr-FR', { minimumFractionDigits: 0 })
              : '-'}
          </p>
          <p className="text-[12px] text-gray-400 mt-1">FCFA</p>
        </div>
        <div className="text-right">
          <VariationBadge value={stock.changePercent} size="md" pill />
          {stock.volume > 0 && (
            <p className="text-[11px] text-gray-400 mt-1">
              Vol: {stock.volume.toLocaleString('fr-FR')}
            </p>
          )}
        </div>
      </div>
      <div className="mt-3 pt-2 border-t border-black/[0.04]">
        <span className="text-[10px] text-gray-400">{stock.sector}</span>
      </div>
    </div>
  );
}

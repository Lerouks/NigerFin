'use client';

import type { CommodityPrice as CommodityPriceType } from '@/lib/services/commodities-service';
import { VariationBadge } from './VariationBadge';

interface CommodityPriceProps {
  commodity: CommodityPriceType;
  xofRate?: number | null;
}

export function CommodityPrice({ commodity, xofRate }: CommodityPriceProps) {
  return (
    <div className="group bg-white rounded-xl border border-black/[0.06] p-5 hover:border-black/[0.1] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[14px] font-semibold">{commodity.name}</p>
          <p className="text-[11px] text-gray-400 font-mono mt-0.5">{commodity.symbol}</p>
        </div>
        <span className="text-[10px] text-gray-400 bg-[#f5f5f0] px-2 py-0.5 rounded-full">
          {commodity.source}
        </span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-semibold text-gray-900 leading-none tabular-nums">
            {commodity.price.toLocaleString('fr-FR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <p className="text-[12px] text-gray-400 mt-1">{commodity.unit}</p>
          {xofRate && commodity.currency === 'USD' && (
            <p className="text-[11px] text-gray-500 mt-0.5">
              ~{Math.round(commodity.price * xofRate).toLocaleString('fr-FR')} FCFA
            </p>
          )}
        </div>
        <VariationBadge value={commodity.changePercent} size="md" pill />
      </div>
      <div className="mt-3 pt-2 border-t border-black/[0.04] flex items-center justify-between">
        <span className="text-[10px] text-gray-400">Source : {commodity.source}</span>
        <span className="text-[10px] text-gray-400">
          {new Date(commodity.date).toLocaleDateString('fr-FR')}
        </span>
      </div>
    </div>
  );
}

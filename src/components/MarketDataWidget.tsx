'use client';

import { useMemo } from 'react';
import { useMarketData, groupByType, type MarketDataType } from '@/hooks/useMarketData';
import { VariationBadge } from '@/components/data/VariationBadge';

const TYPE_LABELS: Record<MarketDataType, string> = {
  currency: 'Devises',
  commodity: 'Matières premières',
  index: 'Indices',
  crypto: 'Cryptomonnaies',
};

const TYPE_ORDER: MarketDataType[] = ['currency', 'commodity', 'index', 'crypto'];

/**
 * Compact market data sidebar widget.
 * Reads from admin-managed Supabase market_data table.
 */
export function MarketDataWidget() {
  const { items, isLoading } = useMarketData();

  const groupedData = useMemo(() => groupByType(items), [items]);

  const lastUpdated = useMemo(() => {
    let latest: string | null = null;
    for (const item of items) {
      if (item.updatedAt && (!latest || item.updatedAt > latest)) {
        latest = item.updatedAt;
      }
    }
    return latest;
  }, [items]);

  if (isLoading && items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-black/[0.06] sticky top-36 overflow-hidden">
        <div className="border-b border-black/[0.05] px-5 py-4">
          <h3 className="text-[15px] font-semibold">Marchés</h3>
        </div>
        <div className="p-5 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex justify-between items-center py-1.5">
              <div className="h-3 w-24 bg-[#f5f1e6] rounded animate-pulse" />
              <div className="h-3 w-16 bg-[#f5f1e6] rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-black/[0.06] sticky top-36 overflow-hidden">
      <div className="border-b border-black/[0.05] px-5 py-4">
        <h3 className="text-[15px] font-semibold">Marchés</h3>
      </div>
      <div className="p-5 space-y-5">
        {TYPE_ORDER.map((type) => {
          const group = groupedData[type];
          if (!group || group.length === 0) return null;

          return (
            <div key={type}>
              <h4 className="text-[11px] uppercase tracking-[0.14em] font-semibold text-gray-500 mb-3">
                {TYPE_LABELS[type]}
              </h4>
              <div className="space-y-2.5">
                {group.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center py-1.5 px-2 -mx-2 rounded-lg hover:bg-[#fafaf9] transition-colors cursor-default"
                  >
                    <div className="flex-1">
                      <div className="text-[13px] font-medium">{item.name}</div>
                      <div className="text-[11px] text-gray-400">{item.symbol}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[13px] tabular-nums font-medium">
                        {item.value.toLocaleString('fr-FR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                        {item.unit && (
                          <span className="text-[10px] text-gray-400 ml-0.5">{item.unit}</span>
                        )}
                      </div>
                      <div className="flex justify-end">
                        {item.symbol === 'EUR/XOF' ? (
                          <span className="text-[10px] text-gray-400">Taux fixe</span>
                        ) : (
                          <VariationBadge value={item.changePercent} pill />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-t border-black/[0.04] px-5 py-3 bg-[#fafaf9] rounded-b-xl space-y-0.5">
        <p className="text-[10px] text-gray-400 text-center">
          Données gérées par l&apos;équipe NFI Report
        </p>
        {lastUpdated && (
          <p className="text-[10px] text-gray-400 text-center">
            Dernière mise à jour :{' '}
            {new Date(lastUpdated).toLocaleString('fr-FR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}
      </div>
    </div>
  );
}

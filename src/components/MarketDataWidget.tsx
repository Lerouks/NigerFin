'use client';

import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useForex } from '@/hooks/useForex';
import { useCommodities } from '@/hooks/useCommodities';
import { useBRVMIndices } from '@/hooks/useBRVMIndices';
import type { MarketData } from '@/types';

const TYPE_LABELS: Record<MarketData['type'], string> = {
  currency: 'Devises',
  commodity: 'Matières premières',
  index: 'Indices',
  crypto: 'Cryptomonnaies',
};

interface MarketDataWidgetProps {
  data: MarketData[];
}

export function MarketDataWidget({ data: fallbackData }: MarketDataWidgetProps) {
  const [data, setData] = useState<MarketData[]>(fallbackData);

  // Real-time hooks
  const forex = useForex();
  const commodities = useCommodities();
  const brvmIndices = useBRVMIndices();

  useEffect(() => {
    fetch('/api/market-data')
      .then((res) => res.json())
      .then((fetched) => {
        if (Array.isArray(fetched) && fetched.length > 0) setData(fetched);
      })
      .catch(() => {});
  }, []);

  // Merge real-time data with existing data
  const mergedData = useMemo(() => {
    const items = [...data];

    // Override currency values from forex API
    if (forex.data) {
      for (const rate of forex.data) {
        const existing = items.find((i) => i.type === 'currency' && i.symbol === `${rate.base}/XOF`);
        if (existing) {
          existing.value = rate.rateInXOF;
          existing.change = rate.change;
          existing.changePercent = rate.changePercent;
          existing.source = 'Frankfurter/ECB';
          existing.updatedAt = rate.date;
        }
      }
    }

    // Override commodity values
    if (commodities.data) {
      for (const commodity of commodities.data) {
        const symbolMap: Record<string, string> = { BRENT: 'BRENT', XAU: 'XAU', U3O8: 'U3O8' };
        const symbol = symbolMap[commodity.symbol];
        if (symbol) {
          const existing = items.find((i) => i.symbol === symbol);
          if (existing) {
            existing.value = commodity.price;
            existing.change = commodity.change;
            existing.changePercent = commodity.changePercent;
            existing.source = commodity.source;
            existing.updatedAt = commodity.date;
          }
        }
      }
    }

    // Override BRVM index
    if (brvmIndices.data) {
      const composite = brvmIndices.data.find((i) => i.name.includes('Composite'));
      if (composite) {
        const existing = items.find((i) => i.symbol === 'BRVMC');
        if (existing) {
          existing.value = composite.value;
          existing.change = composite.change;
          existing.changePercent = composite.changePercent;
          existing.source = 'BRVM';
          existing.updatedAt = composite.date;
        }
      }
    }

    return items;
  }, [data, forex.data, commodities.data, brvmIndices.data]);

  const { groupedData, lastUpdated } = useMemo(() => {
    const grouped = mergedData.reduce((acc, item) => {
      if (!acc[item.type]) acc[item.type] = [];
      acc[item.type].push(item);
      return acc;
    }, {} as Record<string, MarketData[]>);

    let latest: string | null = null;
    for (const item of mergedData) {
      if (item.updatedAt && (!latest || item.updatedAt > latest)) {
        latest = item.updatedAt;
      }
    }

    return { groupedData: grouped, lastUpdated: latest };
  }, [mergedData]);

  return (
    <div className="bg-white rounded-xl border border-black/[0.06] sticky top-36 overflow-hidden">
      <div className="border-b border-black/[0.05] px-5 py-4">
        <h3 className="text-[15px] font-semibold">Marchés</h3>
      </div>
      <div className="p-5 space-y-5">
        {Object.entries(groupedData).map(([type, items]) => (
          <div key={type}>
            <h4 className="text-[10px] uppercase tracking-[0.12em] text-gray-400 mb-3">
              {TYPE_LABELS[type as MarketData['type']]}
            </h4>
            <div className="space-y-2.5">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-1.5 px-2 -mx-2 rounded-lg hover:bg-[#fafaf9] transition-colors cursor-default">
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
                    <div
                      className={`text-[11px] flex items-center justify-end gap-0.5 font-medium ${
                        item.change >= 0 ? 'text-emerald-600' : 'text-red-500'
                      }`}
                    >
                      {item.change >= 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {item.changePercent > 0 ? '+' : ''}
                      {item.changePercent.toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-black/[0.04] px-5 py-3 bg-[#fafaf9] rounded-b-xl space-y-0.5">
        <p className="text-[10px] text-gray-400 text-center">
          Données en temps réel &middot; Frankfurter, BRVM, ECB
        </p>
        {lastUpdated && (
          <p className="text-[10px] text-gray-400 text-center">
            Dernière mise à jour : {new Date(lastUpdated).toLocaleString('fr-FR', {
              day: '2-digit', month: '2-digit', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </p>
        )}
      </div>
    </div>
  );
}

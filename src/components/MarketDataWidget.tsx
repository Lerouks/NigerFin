'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { MarketData } from '@/types';

interface MarketDataWidgetProps {
  data: MarketData[];
}

export function MarketDataWidget({ data: fallbackData }: MarketDataWidgetProps) {
  const [data, setData] = useState<MarketData[]>(fallbackData);

  useEffect(() => {
    fetch('/api/market-data')
      .then((res) => res.json())
      .then((fetched) => {
        if (Array.isArray(fetched) && fetched.length > 0) setData(fetched);
      })
      .catch(() => {});
  }, []);

  const getTypeLabel = (type: MarketData['type']) => {
    switch (type) {
      case 'currency': return 'Devises';
      case 'commodity': return 'Matières premières';
      case 'index': return 'Indices';
      case 'crypto': return 'Cryptomonnaies';
    }
  };

  const groupedData = data.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item);
    return acc;
  }, {} as Record<string, MarketData[]>);

  // Find the most recent updatedAt across all items
  const lastUpdated = data.reduce((latest, item) => {
    if (!item.updatedAt) return latest;
    if (!latest) return item.updatedAt;
    return item.updatedAt > latest ? item.updatedAt : latest;
  }, null as string | null);

  return (
    <div className="bg-white rounded-xl border border-black/[0.06] sticky top-36 overflow-hidden">
      <div className="border-b border-black/[0.05] px-5 py-4">
        <h3 className="text-[15px] font-semibold">Marchés</h3>
      </div>
      <div className="p-5 space-y-5">
        {Object.entries(groupedData).map(([type, items]) => (
          <div key={type}>
            <h4 className="text-[10px] uppercase tracking-[0.12em] text-gray-400 mb-3">
              {getTypeLabel(type as MarketData['type'])}
            </h4>
            <div className="space-y-2.5">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-1">
                  <div className="flex-1">
                    <div className="text-[13px]">{item.name}</div>
                    <div className="text-[11px] text-gray-400">{item.symbol}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[13px] tabular-nums">
                      {item.value.toLocaleString('fr-FR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                      {item.unit && (
                        <span className="text-[10px] text-gray-400 ml-0.5">{item.unit}</span>
                      )}
                    </div>
                    <div
                      className={`text-[11px] flex items-center justify-end gap-0.5 ${
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
          Variations par rapport à la dernière mise à jour
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

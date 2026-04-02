'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, BookOpen, ChevronRight } from 'lucide-react';
import { useForex } from '@/hooks/useForex';
import { useBRVMIndices } from '@/hooks/useBRVMIndices';
import { useCommodities } from '@/hooks/useCommodities';
import { useCrypto } from '@/hooks/useCrypto';
import { useIndices } from '@/hooks/useIndices';
import { ForexTicker } from '@/components/data/ForexTicker';
import { CommodityPrice as CommodityPriceComponent } from '@/components/data/CommodityPrice';
import { DataWidget } from '@/components/data/DataWidget';
import type { MarketData } from '@/types';

const TYPE_LABELS: Record<MarketData['type'], string> = {
  currency: 'Devises',
  commodity: 'Matières premières',
  index: 'Indices',
  crypto: 'Cryptomonnaies',
};

const TYPE_DESCRIPTIONS: Record<MarketData['type'], string> = {
  currency: 'Taux de change des principales devises',
  commodity: 'Cours des matières premières stratégiques',
  index: 'Performance des principaux indices boursiers',
  crypto: 'Cours des principales cryptomonnaies',
};

interface MarchesContentProps {
  fallbackData: MarketData[];
}

export function MarchesContent({ fallbackData }: MarchesContentProps) {
  const [data, setData] = useState<MarketData[]>(fallbackData);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Real-time data hooks
  const forex = useForex();
  const brvmIndices = useBRVMIndices();
  const commodities = useCommodities();
  const crypto = useCrypto();
  const indices = useIndices();

  useEffect(() => {
    fetch('/api/market-data')
      .then((res) => res.json())
      .then((fetched) => {
        if (Array.isArray(fetched) && fetched.length > 0) setData(fetched);
      })
      .catch(() => {});
  }, []);

  // Merge real-time data into the main dataset
  const mergedData = useMemo(() => {
    const items = data.map((item) => ({ ...item }));

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
      const symbolMap: Record<string, string> = { BRENT: 'BRENT', XAU: 'XAU', U3O8: 'U3O8', CT: 'CT' };
      for (const commodity of commodities.data) {
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

    // Override crypto values
    if (crypto.data) {
      for (const coin of crypto.data) {
        const existing = items.find((i) => i.symbol === coin.symbol);
        if (existing) {
          existing.value = coin.price;
          existing.change = coin.change24h;
          existing.changePercent = coin.changePercent24h;
          existing.source = 'CoinGecko';
          existing.updatedAt = coin.date;
        }
      }
    }

    // Override global indices (Nasdaq, S&P 500, STOXX Europe 600)
    if (indices.data) {
      for (const quote of indices.data) {
        const existing = items.find((i) => i.symbol === quote.symbol);
        if (existing) {
          existing.value = quote.price;
          existing.change = quote.change;
          existing.changePercent = quote.changePercent;
          existing.source = 'Yahoo Finance';
          existing.updatedAt = quote.date;
        }
      }
    }

    return items;
  }, [data, forex.data, commodities.data, brvmIndices.data, crypto.data, indices.data]);

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

  // Find USD/XOF rate for price conversion
  const usdXofRate = forex.data?.find((r) => r.base === 'USD')?.rateInXOF || null;

  return (
    <div className="space-y-8">
      {/* Existing market data display */}
      {Object.entries(groupedData).map(([type, items]) => (
        <div key={type}>
          <div className="mb-4">
            <h2 className="text-lg font-semibold">{TYPE_LABELS[type as MarketData['type']]}</h2>
            <p className="text-[13px] text-gray-500 mt-0.5">
              {TYPE_DESCRIPTIONS[type as MarketData['type']]}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-black/[0.06] divide-y divide-black/[0.04] overflow-hidden">
            {items.map((item) => {
              const isExpanded = expandedId === item.id;
              const hasEducation = !!(item.description || item.educationLink);

              return (
                <div key={item.id}>
                  <div
                    className={`flex items-center justify-between px-5 py-4 transition-colors ${
                      hasEducation ? 'cursor-pointer hover:bg-gray-50/60' : ''
                    }`}
                    onClick={() => hasEducation && setExpandedId(isExpanded ? null : item.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[15px] font-medium">{item.name}</span>
                        <span className="text-[11px] text-gray-400 font-mono">{item.symbol}</span>
                        {hasEducation && (
                          <BookOpen className={`w-3.5 h-3.5 transition-colors ${isExpanded ? 'text-[#111]' : 'text-gray-300'}`} />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-6 flex-shrink-0">
                      <div className="text-right">
                        <div className="text-[15px] font-semibold tabular-nums">
                          {item.value.toLocaleString('fr-FR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                          {item.unit && (
                            <span className="text-[11px] text-gray-400 font-normal ml-1">{item.unit}</span>
                          )}
                        </div>
                      </div>
                      <div
                        className={`flex items-center gap-1 min-w-[80px] justify-end text-[13px] font-medium ${
                          item.change >= 0 ? 'text-emerald-600' : 'text-red-500'
                        }`}
                      >
                        {item.change >= 0 ? (
                          <TrendingUp className="w-3.5 h-3.5" />
                        ) : (
                          <TrendingDown className="w-3.5 h-3.5" />
                        )}
                        {item.changePercent > 0 ? '+' : ''}
                        {item.changePercent.toFixed(2)}%
                      </div>
                    </div>
                  </div>

                  {/* Pedagogical expansion panel */}
                  {isExpanded && hasEducation && (
                    <div className="px-5 pb-4 -mt-1">
                      <div className="bg-[#fafaf9] rounded-lg border border-black/[0.04] px-4 py-3">
                        {item.description && (
                          <p className="text-[13px] text-gray-600 leading-relaxed">
                            {item.description}
                          </p>
                        )}
                        {item.educationLink && (
                          <Link
                            href={item.educationLink}
                            className="inline-flex items-center gap-1.5 mt-2.5 text-[13px] font-medium text-[#111] hover:underline group"
                          >
                            Comprendre cet actif
                            <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Real-time Forex Rates */}
      {forex.data && forex.data.length > 0 && (
        <div>
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Taux de change en temps réel</h2>
            <p className="text-[13px] text-gray-500 mt-0.5">Cours XOF depuis Frankfurter/ECB</p>
          </div>
          <ForexTicker rates={forex.data} source={forex.source} lastUpdated={forex.lastUpdated} />
        </div>
      )}
      {forex.isLoading && (
        <DataWidget title="Taux de change en temps réel" isLoading>
          <div />
        </DataWidget>
      )}

      {/* BRVM Indices */}
      {brvmIndices.data && brvmIndices.data.length > 0 && (
        <div>
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Indices BRVM</h2>
            <p className="text-[13px] text-gray-500 mt-0.5">BRVM Composite et BRVM 30</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {brvmIndices.data.map((idx) => (
              <div key={idx.name} className="bg-white rounded-xl border border-black/[0.06] p-5">
                <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-2">{idx.name}</p>
                <div className="flex items-end justify-between">
                  <p className="text-2xl font-semibold tabular-nums">{idx.value.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</p>
                  <div className={`flex items-center gap-1 text-[13px] font-medium ${idx.changePercent >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {idx.changePercent >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {idx.changePercent > 0 ? '+' : ''}{idx.changePercent.toFixed(2)}%
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 mt-2">Source : BRVM &middot; {new Date(idx.date).toLocaleDateString('fr-FR')}</p>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* Commodities */}
      {commodities.data && commodities.data.length > 0 && (
        <div>
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Matières premières en temps réel</h2>
            <p className="text-[13px] text-gray-500 mt-0.5">Pétrole, or, uranium, coton</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {commodities.data.map((c) => (
              <CommodityPriceComponent key={c.symbol} commodity={c} xofRate={usdXofRate} />
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center space-y-1 pt-2">
        <p className="text-[11px] text-gray-400">
          Variations par rapport à la dernière mise à jour
        </p>
        {lastUpdated && (
          <p className="text-[11px] text-gray-400">
            Dernière mise à jour : {new Date(lastUpdated).toLocaleString('fr-FR', {
              day: '2-digit', month: '2-digit', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </p>
        )}
      </div>

      {/* Education CTA */}
      <div className="bg-[#111] rounded-xl p-6 text-center">
        <BookOpen className="w-6 h-6 text-white/60 mx-auto mb-3" />
        <h3 className="text-white text-lg font-semibold mb-2">Comprendre les marchés financiers</h3>
        <p className="text-white/50 text-[14px] mb-4 max-w-md mx-auto">
          Accédez à nos cours pour comprendre les indices, devises, matières premières et cryptomonnaies en profondeur.
        </p>
        <Link
          href="/education"
          className="inline-flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-lg text-[14px] font-medium hover:bg-white/90 transition-colors"
        >
          Explorer les cours
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

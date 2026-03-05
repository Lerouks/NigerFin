'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, BookOpen, ChevronRight } from 'lucide-react';
import type { MarketData } from '@/types';

interface MarchesContentProps {
  fallbackData: MarketData[];
}

export function MarchesContent({ fallbackData }: MarchesContentProps) {
  const [data, setData] = useState<MarketData[]>(fallbackData);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
    }
  };

  const getTypeDescription = (type: MarketData['type']) => {
    switch (type) {
      case 'currency': return 'Taux de change des principales devises';
      case 'commodity': return 'Cours des matières premières stratégiques';
      case 'index': return 'Performance des principaux indices boursiers';
    }
  };

  const groupedData = data.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item);
    return acc;
  }, {} as Record<string, MarketData[]>);

  const lastUpdated = data.reduce((latest, item) => {
    if (!item.updatedAt) return latest;
    if (!latest) return item.updatedAt;
    return item.updatedAt > latest ? item.updatedAt : latest;
  }, null as string | null);

  return (
    <div className="space-y-8">
      {Object.entries(groupedData).map(([type, items]) => (
        <div key={type}>
          <div className="mb-4">
            <h2 className="text-lg font-semibold">{getTypeLabel(type as MarketData['type'])}</h2>
            <p className="text-[13px] text-gray-500 mt-0.5">
              {getTypeDescription(type as MarketData['type'])}
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
          Accédez à nos cours pour comprendre les indices, devises et matières premières en profondeur.
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

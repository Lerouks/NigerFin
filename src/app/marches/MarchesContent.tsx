'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, BookOpen, ChevronRight } from 'lucide-react';
import { useMarketData, groupByType, type MarketDataType } from '@/hooks/useMarketData';
import type { MarketData } from '@/types';

const TYPE_LABELS: Record<MarketDataType, string> = {
  currency: 'Devises',
  commodity: 'Matières premières',
  index: 'Indices',
  crypto: 'Cryptomonnaies',
};

const TYPE_DESCRIPTIONS: Record<MarketDataType, string> = {
  currency: 'Taux de change des principales devises',
  commodity: 'Cours des matières premières stratégiques',
  index: 'Performance des principaux indices boursiers',
  crypto: 'Cours des principales cryptomonnaies',
};

const TYPE_ORDER: MarketDataType[] = ['currency', 'commodity', 'index', 'crypto'];

export function MarchesContent() {
  const { items, isLoading } = useMarketData();
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
      <div className="space-y-8">
        {TYPE_ORDER.map((type) => (
          <div key={type}>
            <div className="mb-4">
              <div className="h-5 w-40 bg-gray-200 rounded-sm animate-pulse" />
              <div className="h-3 w-64 bg-gray-100 rounded-sm animate-pulse mt-2" />
            </div>
            <div className="bg-white rounded-xl border border-black/6 divide-y divide-black/4 overflow-hidden">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between px-5 py-4">
                  <div className="h-4 w-32 bg-gray-100 rounded-sm animate-pulse" />
                  <div className="h-4 w-20 bg-gray-100 rounded-sm animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Grouped market data */}
      {TYPE_ORDER.map((type) => {
        const group = groupedData[type];
        if (!group || group.length === 0) return null;

        return (
          <div key={type}>
            <div className="mb-4">
              <h2 className="text-lg font-semibold">{TYPE_LABELS[type]}</h2>
              <p className="text-[13px] text-gray-500 mt-0.5">{TYPE_DESCRIPTIONS[type]}</p>
            </div>
            <div className="bg-white rounded-xl border border-black/6 divide-y divide-black/4 overflow-hidden">
              {group.map((item) => (
                <QuoteRow
                  key={item.id}
                  item={item}
                  isExpanded={expandedId === item.id}
                  onToggle={() =>
                    setExpandedId(expandedId === item.id ? null : item.id)
                  }
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Footer */}
      {/*
        Meme inversion que dans MarketDataWidget : la caution editoriale et la
        mention des variations s'affichaient sans condition, la date seulement si
        elle existait. On pouvait donc lire « Variations par rapport a la derniere
        mise a jour » sans qu'aucune date de mise a jour ne soit donnee. C'est la
        date qui commande le bloc.
      */}
      <div className="text-center space-y-1 pt-2">
        {lastUpdated ? (
          <>
            <p className="text-[11px] text-gray-500 tabular-nums">
              Dernière mise à jour&nbsp;:{' '}
              {new Date(lastUpdated).toLocaleString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
            <p className="text-[11px] text-gray-500">
              Variations depuis la clôture précédente
            </p>
            <p className="text-[11px] text-gray-500">
              Données gérées par l&apos;équipe NFI Report
            </p>
          </>
        ) : (
          <p className="text-[11px] text-gray-500">
            Date de mise à jour non disponible
          </p>
        )}
      </div>

      {/* Education CTA */}
      <div className="bg-[#111] rounded-xl p-6 text-center">
        <BookOpen className="w-6 h-6 text-white/60 mx-auto mb-3" />
        <h3 className="text-white text-lg font-semibold mb-2">
          Comprendre les marchés financiers
        </h3>
        <p className="text-white/50 text-[14px] mb-4 max-w-md mx-auto">
          Accédez à nos cours pour comprendre les indices, devises, matières premières et
          cryptomonnaies.
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

// ── Quote row component ────────────────────────────────────────

function QuoteRow({
  item,
  isExpanded,
  onToggle,
}: {
  item: MarketData;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const hasEducation = !!(item.description || item.educationLink);

  return (
    <div>
      <div
        className={`flex items-center justify-between px-5 py-4 transition-colors ${
          hasEducation ? 'cursor-pointer hover:bg-gray-50/60' : ''
        }`}
        onClick={() => hasEducation && onToggle()}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-medium">{item.name}</span>
            <span className="text-[11px] text-gray-500 font-mono">{item.symbol}</span>
            {hasEducation && (
              <BookOpen
                className={`w-3.5 h-3.5 transition-colors ${
                  isExpanded ? 'text-[#111]' : 'text-gray-400'
                }`}
                aria-hidden="true"
              />
            )}
          </div>
        </div>
        <div className="flex items-center gap-6 shrink-0">
          <div className="text-right">
            <div className="text-[15px] font-semibold tabular-nums">
              {item.value.toLocaleString('fr-FR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
              {item.unit && (
                <span className="text-[11px] text-gray-500 font-normal ml-1">{item.unit}</span>
              )}
            </div>
          </div>
          {item.symbol === 'EUR/XOF' ? (
            <div className="flex items-center gap-1 min-w-[80px] justify-end text-[13px] font-medium text-gray-500">
              Taux fixe
            </div>
          ) : item.changePercent === null || item.change === null ? (
            // Variation non mesuree : tiret neutre, ni fleche ni couleur, qui
            // affirmeraient toutes deux un sens de marche jamais constate.
            <div
              className="flex items-center gap-1 min-w-[80px] justify-end text-[13px] font-medium text-gray-400"
              title="Variation non disponible"
            >
              &ndash;
            </div>
          ) : (
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
              {item.changePercent.toFixed(2).replace('.', ',')}&nbsp;%
            </div>
          )}
        </div>
      </div>

      {/* Pedagogical expansion panel */}
      {isExpanded && hasEducation && (
        <div className="px-5 pb-4 -mt-1">
          <div className="bg-background rounded-lg border border-black/4 px-4 py-3">
            {item.description && (
              <p className="text-[13px] text-gray-600 leading-relaxed">{item.description}</p>
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
}

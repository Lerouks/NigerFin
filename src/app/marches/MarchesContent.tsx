'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, BookOpen, ChevronRight, AlertTriangle } from 'lucide-react';
import { useFinancialData, groupQuotesByType } from '@/hooks/useFinancialData';
import type { FinancialQuote, AssetType } from '@/lib/financial-data/types';

const TYPE_LABELS: Record<AssetType, string> = {
  currency: 'Devises',
  commodity: 'Matières premières',
  index: 'Indices',
  crypto: 'Cryptomonnaies',
};

const TYPE_DESCRIPTIONS: Record<AssetType, string> = {
  currency: 'Taux de change des principales devises',
  commodity: 'Cours des matières premières stratégiques',
  index: 'Performance des principaux indices boursiers',
  crypto: 'Cours des principales cryptomonnaies',
};

const TYPE_ORDER: AssetType[] = ['currency', 'commodity', 'index', 'crypto'];

export function MarchesContent() {
  const { quotes, errors, isLoading, fetchedAt } = useFinancialData();
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);

  const groupedData = useMemo(() => groupQuotesByType(quotes), [quotes]);

  const lastUpdated = useMemo(() => {
    let latest: string | null = null;
    for (const q of quotes) {
      if (q.marketTime && (!latest || q.marketTime > latest)) {
        latest = q.marketTime;
      }
    }
    return latest;
  }, [quotes]);

  if (isLoading && quotes.length === 0) {
    return (
      <div className="space-y-8">
        {TYPE_ORDER.map((type) => (
          <div key={type}>
            <div className="mb-4">
              <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-64 bg-gray-100 rounded animate-pulse mt-2" />
            </div>
            <div className="bg-white rounded-xl border border-black/[0.06] divide-y divide-black/[0.04] overflow-hidden">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between px-5 py-4">
                  <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
                  <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
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
      {/* Error banner for failed assets */}
      {errors.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[14px] font-medium text-amber-800">
                Certaines données sont temporairement indisponibles
              </p>
              <ul className="mt-1 space-y-0.5">
                {errors.map((err) => (
                  <li key={err.symbol} className="text-[12px] text-amber-600">
                    {err.name} — {err.reason}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Grouped market data */}
      {TYPE_ORDER.map((type) => {
        const items = groupedData[type];
        if (!items || items.length === 0) return null;

        return (
          <div key={type}>
            <div className="mb-4">
              <h2 className="text-lg font-semibold">{TYPE_LABELS[type]}</h2>
              <p className="text-[13px] text-gray-500 mt-0.5">{TYPE_DESCRIPTIONS[type]}</p>
            </div>
            <div className="bg-white rounded-xl border border-black/[0.06] divide-y divide-black/[0.04] overflow-hidden">
              {items.map((item) => (
                <QuoteRow
                  key={item.symbol}
                  quote={item}
                  isExpanded={expandedSymbol === item.symbol}
                  onToggle={() =>
                    setExpandedSymbol(expandedSymbol === item.symbol ? null : item.symbol)
                  }
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Footer */}
      <div className="text-center space-y-1 pt-2">
        <p className="text-[11px] text-gray-400">
          Variations par rapport à la dernière mise à jour
        </p>
        {lastUpdated && (
          <p className="text-[11px] text-gray-400">
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
        {fetchedAt && (
          <p className="text-[10px] text-gray-300">
            Sources : Frankfurter/ECB, Yahoo Finance, CoinGecko, BRVM, TradingEconomics
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
          cryptomonnaies en profondeur.
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
  quote,
  isExpanded,
  onToggle,
}: {
  quote: FinancialQuote;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const hasEducation = !!(quote.description || quote.educationLink);
  const isStaleSource = quote.source.includes('(cache)');

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
            <span className="text-[15px] font-medium">{quote.name}</span>
            <span className="text-[11px] text-gray-400 font-mono">{quote.symbol}</span>
            {hasEducation && (
              <BookOpen
                className={`w-3.5 h-3.5 transition-colors ${
                  isExpanded ? 'text-[#111]' : 'text-gray-300'
                }`}
              />
            )}
            {isStaleSource && (
              <span className="text-[10px] text-amber-500 font-medium">cache</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-6 flex-shrink-0">
          <div className="text-right">
            <div className="text-[15px] font-semibold tabular-nums">
              {quote.price.toLocaleString('fr-FR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
              {quote.unit && (
                <span className="text-[11px] text-gray-400 font-normal ml-1">{quote.unit}</span>
              )}
            </div>
          </div>
          <div
            className={`flex items-center gap-1 min-w-[80px] justify-end text-[13px] font-medium ${
              quote.change >= 0 ? 'text-emerald-600' : 'text-red-500'
            }`}
          >
            {quote.change >= 0 ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            {quote.changePercent > 0 ? '+' : ''}
            {quote.changePercent.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Pedagogical expansion panel */}
      {isExpanded && hasEducation && (
        <div className="px-5 pb-4 -mt-1">
          <div className="bg-[#fafaf9] rounded-lg border border-black/[0.04] px-4 py-3">
            {quote.description && (
              <p className="text-[13px] text-gray-600 leading-relaxed">{quote.description}</p>
            )}
            {quote.educationLink && (
              <Link
                href={quote.educationLink}
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

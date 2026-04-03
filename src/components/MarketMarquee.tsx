'use client';

import { useFinancialData } from '@/hooks/useFinancialData';

/**
 * Scrolling marquee of market prices for the homepage header.
 * Uses the centralized financial data layer (RULE 1).
 */
export function MarketMarquee() {
  const { quotes, isLoading } = useFinancialData();

  if (isLoading && quotes.length === 0) {
    return (
      <div className="overflow-hidden flex-1 min-w-0">
        <div className="inline-flex items-center gap-8 whitespace-nowrap">
          {[1, 2, 3, 4, 5].map((i) => (
            <span key={i} className="inline-flex items-center gap-2 text-[12px]">
              <span className="h-3 w-12 bg-white/10 rounded animate-pulse" />
              <span className="h-3 w-16 bg-white/10 rounded animate-pulse" />
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (quotes.length === 0) return null;

  // Double the array for seamless looping marquee
  const doubled = [...quotes, ...quotes];

  return (
    <div className="overflow-hidden flex-1 min-w-0 relative">
      <div className="inline-flex items-center gap-8 animate-marquee whitespace-nowrap will-change-transform" style={{ width: 'max-content' }}>
        {doubled.map((item, i) => (
          <span
            key={`${item.symbol}-${i}`}
            className="inline-flex items-center gap-2 text-[12px] flex-shrink-0"
          >
            <span className="text-white/50 font-medium">{item.symbol}</span>
            <span className="text-white/80 tabular-nums">
              {item.price.toLocaleString('fr-FR')}
            </span>
            <span
              className={`text-[11px] tabular-nums ${
                item.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {item.changePercent >= 0 ? '+' : ''}
              {item.changePercent.toFixed(2)}%
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

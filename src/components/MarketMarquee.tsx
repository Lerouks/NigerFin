'use client';

import { useMarketData } from '@/hooks/useMarketData';

/**
 * Scrolling marquee of market prices for the homepage header.
 * Reads from admin-managed Supabase market_data table.
 */
export function MarketMarquee() {
  const { items, isLoading } = useMarketData();

  if (isLoading && items.length === 0) {
    return (
      <div className="overflow-hidden flex-1 min-w-0">
        <div className="inline-flex items-center gap-8 whitespace-nowrap">
          {[1, 2, 3, 4, 5].map((i) => (
            <span key={i} className="inline-flex items-center gap-2 text-[12px]">
              <span className="h-3 w-12 bg-white/10 rounded-sm animate-pulse" />
              <span className="h-3 w-16 bg-white/10 rounded-sm animate-pulse" />
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) return null;

  // Double the array for seamless looping marquee
  const doubled = [...items, ...items];

  return (
    <div className="overflow-hidden flex-1 min-w-0 relative">
      <div className="inline-flex items-center gap-8 animate-marquee whitespace-nowrap will-change-transform" style={{ width: 'max-content' }}>
        {doubled.map((item, i) => (
          <span
            key={`${item.id}-${i}`}
            className="inline-flex items-center gap-2 text-[12px] shrink-0"
          >
            <span className="text-white/50 font-medium">{item.symbol}</span>
            <span className="text-white/80 tabular-nums">
              {item.value.toLocaleString('fr-FR')}
            </span>
            {item.symbol === 'EUR/XOF' ? (
              <span className="text-[11px] text-white/30">fixe</span>
            ) : (
              <span
                className={`text-[11px] tabular-nums ${
                  item.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {item.changePercent >= 0 ? '+' : ''}
                {item.changePercent.toFixed(2)}%
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

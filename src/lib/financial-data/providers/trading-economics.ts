/**
 * TradingEconomics Provider (Fallback)
 *
 * RULE 4: Automatic fallback — used when Yahoo Finance fails for commodities.
 * Uses the guest API (limited but free).
 */

import type { RawQuote } from '../types';

const COMMODITY_NAMES: Record<string, string> = {
  brent: 'brent',
  uranium: 'uranium',
  cotton: 'cotton',
  gold: 'gold',
};

/**
 * Fetch a commodity price from TradingEconomics public API.
 * @param commodityKey - Internal key (e.g. 'brent', 'uranium')
 */
export async function fetchTradingEconomicsQuote(commodityKey: string): Promise<RawQuote> {
  const searchTerm = COMMODITY_NAMES[commodityKey];
  if (!searchTerm) {
    throw new Error(`TradingEconomics: unknown commodity key "${commodityKey}"`);
  }

  const url = 'https://api.tradingeconomics.com/markets/commodity?c=guest:guest&f=json';
  const res = await fetch(url, {
    signal: AbortSignal.timeout(10_000),
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });

  if (!res.ok) {
    throw new Error(`TradingEconomics returned HTTP ${res.status}`);
  }

  const data = await res.json();

  if (!Array.isArray(data)) {
    throw new Error('TradingEconomics: unexpected response format');
  }

  const item = data.find(
    (entry: Record<string, unknown>) =>
      typeof entry.Name === 'string' &&
      entry.Name.toLowerCase().includes(searchTerm),
  );

  if (!item?.Last) {
    throw new Error(`TradingEconomics: no data found for "${searchTerm}"`);
  }

  const price = Number(item.Last);
  const change = Number(item.Daily || 0);
  const changePercent = Number(item.DailyPercentual || 0);

  // TradingEconomics provides a Date field
  const dateStr = item.Date;
  if (!dateStr) {
    throw new Error(`TradingEconomics: no date for "${searchTerm}" — cannot validate freshness`);
  }

  return {
    price: Math.round(price * 100) / 100,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100,
    marketTime: new Date(dateStr).toISOString(),
    source: 'TradingEconomics',
  };
}

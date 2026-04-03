/**
 * CoinGecko Provider
 *
 * Fetches cryptocurrency prices from the free CoinGecko API.
 */

import type { RawQuote } from '../types';

/**
 * Fetch a single crypto price from CoinGecko.
 * @param coinId - CoinGecko coin ID (e.g. 'bitcoin', 'ethereum')
 */
export async function fetchCoinGeckoQuote(coinId: string): Promise<RawQuote> {
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true`;

  const res = await fetch(url, {
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    throw new Error(`CoinGecko returned HTTP ${res.status} for ${coinId}`);
  }

  const data = await res.json();
  const coin = data[coinId];

  if (!coin || !coin.usd) {
    throw new Error(`CoinGecko: no data for ${coinId}`);
  }

  const price = coin.usd;
  const changePercent = coin.usd_24h_change ?? 0;
  const change = price * (changePercent / 100);

  // CoinGecko provides last_updated_at as Unix timestamp
  const lastUpdated = coin.last_updated_at;
  if (!lastUpdated) {
    throw new Error(`CoinGecko: no last_updated_at for ${coinId} — cannot validate freshness`);
  }

  const marketTime = new Date(lastUpdated * 1000).toISOString();

  return {
    price: Math.round(price * 100) / 100,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100,
    marketTime,
    source: 'CoinGecko',
  };
}

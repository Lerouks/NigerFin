/**
 * Yahoo Finance Provider
 *
 * Fetches commodity and index prices via the Yahoo Finance v8 chart API.
 * RULE 3: For futures, the ticker MUST be the front-month continuous contract.
 *   - BZ=F = ICE Brent crude front-month
 *   - GC=F = Gold front-month
 *   - CL=F = WTI crude front-month
 *   - ^IXIC, ^GSPC, ^STOXX = Index tickers
 */

import type { RawQuote } from '../types';

/**
 * Fetch a single quote from Yahoo Finance chart API.
 * Uses range=5d to cover weekends; extracts the actual regularMarketTime.
 */
export async function fetchYahooQuote(ticker: string): Promise<RawQuote> {
  // Yahoo requires URL-encoding for special chars: ^GSPC → %5EGSPC, BZ=F → BZ%3DF
  const encodedTicker = encodeURIComponent(ticker);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodedTicker}?range=5d&interval=1d`;

  const res = await fetch(url, {
    signal: AbortSignal.timeout(10_000),
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });

  if (!res.ok) {
    throw new Error(`Yahoo Finance returned HTTP ${res.status} for ${ticker}`);
  }

  const json = await res.json();
  const result = json?.chart?.result?.[0];

  if (!result) {
    throw new Error(`Yahoo Finance: no chart result for ${ticker}`);
  }

  const price = result.meta?.regularMarketPrice;
  if (!price || !Number.isFinite(price)) {
    throw new Error(`Yahoo Finance: no valid price for ${ticker}`);
  }

  // CRITICAL: Use the actual market timestamp, NOT Date.now()
  const regularMarketTime: number | undefined = result.meta?.regularMarketTime;
  if (!regularMarketTime) {
    throw new Error(`Yahoo Finance: no regularMarketTime for ${ticker} — cannot validate freshness`);
  }

  const marketTime = new Date(regularMarketTime * 1000).toISOString();

  const previousClose = result.meta?.chartPreviousClose ?? result.meta?.previousClose ?? price;
  const change = Math.round((price - previousClose) * 100) / 100;
  const changePercent =
    previousClose !== 0
      ? Math.round(((price - previousClose) / previousClose) * 10000) / 100
      : 0;

  return {
    price: Math.round(price * 100) / 100,
    change,
    changePercent,
    marketTime,
    source: 'Yahoo Finance',
  };
}

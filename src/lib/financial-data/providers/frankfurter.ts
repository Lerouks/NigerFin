/**
 * Frankfurter/ECB Provider
 *
 * Fetches forex rates and gold price from the Frankfurter API (backed by ECB).
 * EUR/XOF is a fixed peg at 655.957.
 */

import type { RawQuote } from '../types';

const EUR_XOF_RATE = 655.957;

/**
 * Fetch a currency rate expressed in XOF.
 * @param currencyCode - ISO currency code (e.g. 'USD', 'GBP')
 * For 'EUR', returns the fixed EUR/XOF rate.
 */
export async function fetchFrankfurterQuote(currencyCode: string): Promise<RawQuote> {
  if (currencyCode === 'EUR') {
    // Fixed peg — always fresh
    return {
      price: EUR_XOF_RATE,
      change: 0,
      changePercent: 0,
      marketTime: new Date().toISOString(),
      source: 'Frankfurter/ECB',
    };
  }

  // Fetch latest and previous day rates
  const [latestRes, prevRes] = await Promise.all([
    fetch(`https://api.frankfurter.dev/v1/latest?base=EUR&symbols=${currencyCode}`, {
      signal: AbortSignal.timeout(10_000),
    }),
    // Fetch yesterday's date for change calculation
    fetch(
      `https://api.frankfurter.dev/v1/${getYesterdayISO()}?base=EUR&symbols=${currencyCode}`,
      { signal: AbortSignal.timeout(10_000) },
    ),
  ]);

  if (!latestRes.ok) {
    throw new Error(`Frankfurter returned HTTP ${latestRes.status} for ${currencyCode}`);
  }

  const latest = await latestRes.json();
  const eurRate = latest.rates?.[currencyCode];

  if (!eurRate) {
    throw new Error(`Frankfurter: no rate for ${currencyCode}`);
  }

  const xofRate = EUR_XOF_RATE / eurRate;

  // Calculate change from previous day
  let change = 0;
  let changePercent = 0;
  if (prevRes.ok) {
    const prev = await prevRes.json();
    const prevEurRate = prev.rates?.[currencyCode];
    if (prevEurRate) {
      const prevXofRate = EUR_XOF_RATE / prevEurRate;
      change = xofRate - prevXofRate;
      changePercent = prevXofRate !== 0 ? (change / prevXofRate) * 100 : 0;
    }
  }

  // Frankfurter returns the date of the rate
  const marketTime = latest.date
    ? new Date(latest.date + 'T16:00:00Z').toISOString() // ECB publishes ~16:00 CET
    : new Date().toISOString();

  return {
    price: Math.round(xofRate * 100) / 100,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 1000) / 1000,
    marketTime,
    source: 'Frankfurter/ECB',
  };
}

/**
 * Fetch gold price from Frankfurter (XAU→USD).
 * Used as fallback for the gold commodity.
 */
export async function fetchFrankfurterGoldQuote(): Promise<RawQuote> {
  const res = await fetch('https://api.frankfurter.dev/v1/latest?from=XAU&to=USD', {
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    throw new Error(`Frankfurter gold: HTTP ${res.status}`);
  }

  const data = await res.json();
  const price = data.rates?.USD;

  if (!price) {
    throw new Error('Frankfurter: no gold price');
  }

  const marketTime = data.date
    ? new Date(data.date + 'T16:00:00Z').toISOString()
    : new Date().toISOString();

  return {
    price,
    change: 0,
    changePercent: 0,
    marketTime,
    source: 'Frankfurter/ECB',
  };
}

function getYesterdayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

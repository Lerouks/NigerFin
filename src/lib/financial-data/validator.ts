/**
 * Centralized Financial Data Layer — Validation
 *
 * RULE 2: Validation par la date, pas par le prix.
 * The only reliable validation is data freshness.
 */

import type { RawQuote } from './types';

/**
 * Validate that a quote's market time is within the allowed staleness window.
 * Returns null if valid, or an error message if stale/invalid.
 */
export function validateFreshness(
  quote: RawQuote,
  maxStalenessHours: number,
  assetSymbol: string,
  providerName: string,
): string | null {
  const marketDate = new Date(quote.marketTime);

  if (isNaN(marketDate.getTime())) {
    return `[${assetSymbol}] ${providerName}: invalid marketTime "${quote.marketTime}"`;
  }

  const ageMs = Date.now() - marketDate.getTime();

  // Reject future dates (clock skew tolerance: 5 minutes)
  if (ageMs < -5 * 60 * 1000) {
    return `[${assetSymbol}] ${providerName}: marketTime is in the future (${quote.marketTime})`;
  }

  const ageHours = ageMs / (3600 * 1000);

  if (ageHours > maxStalenessHours) {
    return `[${assetSymbol}] ${providerName}: data is ${ageHours.toFixed(1)}h old, max allowed is ${maxStalenessHours}h (marketTime: ${quote.marketTime})`;
  }

  return null;
}

/**
 * Validate that a price is a reasonable finite number.
 * No price range checks — a price can legitimately take any positive value (RULE 2).
 */
export function validatePrice(price: number, assetSymbol: string, providerName: string): string | null {
  if (!Number.isFinite(price) || price <= 0) {
    return `[${assetSymbol}] ${providerName}: invalid price ${price}`;
  }
  return null;
}

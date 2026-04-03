/**
 * Centralized Financial Data Layer — Type Definitions
 *
 * Single source of truth for all financial data types used across the site.
 */

/** Supported asset categories */
export type AssetType = 'currency' | 'commodity' | 'index' | 'crypto';

/**
 * A validated, display-ready financial quote.
 * Every price shown on the site MUST originate from this type.
 */
export interface FinancialQuote {
  /** Internal symbol (e.g. 'ICEEUR:BRN1!', 'BTC', 'EUR/XOF') */
  symbol: string;
  /** Human-readable name (e.g. 'Pétrole Brent') */
  name: string;
  /** Current price */
  price: number;
  /** Absolute change from previous close */
  change: number;
  /** Percentage change from previous close */
  changePercent: number;
  /** Price currency (e.g. 'USD', 'XOF') */
  currency: string;
  /** Display unit (e.g. 'USD/baril', 'PTS') */
  unit: string;
  /** Data source name (e.g. 'Yahoo Finance', 'CoinGecko') */
  source: string;
  /** Actual market timestamp (NOT fetch time) — ISO 8601 */
  marketTime: string;
  /** When this data was fetched — ISO 8601 */
  fetchedAt: string;
  /** Asset category */
  type: AssetType;
  /** Optional pedagogical description */
  description?: string;
  /** Optional link to education page */
  educationLink?: string;
}

/** Raw quote returned by a provider before validation */
export interface RawQuote {
  price: number;
  change: number;
  changePercent: number;
  /** Actual market timestamp — MUST be the real market time, not Date.now() */
  marketTime: string;
  source: string;
}

/** Configuration for a single data provider */
export interface ProviderConfig {
  /** Provider name for logging */
  name: string;
  /** Ticker/identifier used by this provider */
  ticker: string;
}

/** Full configuration for a financial asset */
export interface AssetConfig {
  symbol: string;
  name: string;
  type: AssetType;
  unit: string;
  currency: string;
  /** Maximum age (hours) before data is considered stale and rejected */
  maxStalenessHours: number;
  /** Ordered list of providers — tried in sequence until one succeeds */
  providers: ProviderConfig[];
  description?: string;
  educationLink?: string;
}

/** Result of a batch fetch operation */
export interface FinancialDataResult {
  /** Successfully fetched quotes */
  quotes: FinancialQuote[];
  /** Assets that failed all providers — these should show error state in UI */
  errors: FinancialDataError[];
  /** When this batch was fetched */
  fetchedAt: string;
}

/** Error info for a failed asset fetch */
export interface FinancialDataError {
  symbol: string;
  name: string;
  type: AssetType;
  reason: string;
  lastAttemptedProviders: string[];
}

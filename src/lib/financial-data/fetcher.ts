/**
 * Centralized Financial Data Fetcher
 *
 * RULE 1: Single source — all financial data transits through this module.
 * RULE 2: Date-based validation — stale data is rejected, not displayed.
 * RULE 3: Front-month — tickers in config.ts enforce this.
 * RULE 4: Automatic fallback — providers are tried in order.
 * RULE 5: Extensibility — add assets in config.ts, no logic changes needed.
 */

import * as Sentry from '@sentry/nextjs';
import { createServiceClient } from '@/lib/supabase';
import { ASSET_CONFIGS } from './config';
import type {
  AssetConfig,
  FinancialQuote,
  FinancialDataResult,
  FinancialDataError,
  RawQuote,
  AssetType,
} from './types';
import { validateFreshness, validatePrice } from './validator';

// Provider fetch functions
import { fetchYahooQuote } from './providers/yahoo';
import { fetchCoinGeckoQuote } from './providers/coingecko';
import { fetchFrankfurterQuote, fetchFrankfurterGoldQuote } from './providers/frankfurter';
import { fetchTradingEconomicsQuote } from './providers/trading-economics';
import { fetchBRVMQuote } from './providers/brvm';

/** Cache TTL in seconds (stored in Supabase api_cache table) */
const CACHE_TTL_SECONDS: Record<AssetType, number> = {
  currency: 3600,    // 1h — forex moves slowly for XOF
  commodity: 1800,   // 30min
  index: 900,        // 15min
  crypto: 300,       // 5min — crypto moves fast
};

/** Map of provider name → fetch function */
const PROVIDER_FETCHERS: Record<string, (ticker: string) => Promise<RawQuote>> = {
  yahoo: fetchYahooQuote,
  coingecko: fetchCoinGeckoQuote,
  frankfurter: fetchFrankfurterQuote,
  'frankfurter-gold': fetchFrankfurterGoldQuote,
  'trading-economics': fetchTradingEconomicsQuote,
  brvm: fetchBRVMQuote,
};

/**
 * Fetch all financial data for the given asset types (or all if not specified).
 * This is the MAIN entry point for the financial data layer.
 */
export async function fetchFinancialData(
  types?: AssetType[],
): Promise<FinancialDataResult> {
  const configs = types
    ? ASSET_CONFIGS.filter((a) => types.includes(a.type))
    : ASSET_CONFIGS;

  const results = await Promise.allSettled(
    configs.map((config) => fetchSingleAsset(config)),
  );

  const quotes: FinancialQuote[] = [];
  const errors: FinancialDataError[] = [];

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const config = configs[i];

    if (result.status === 'fulfilled') {
      quotes.push(result.value);
    } else {
      errors.push({
        symbol: config.symbol,
        name: config.name,
        type: config.type,
        reason: result.reason instanceof Error ? result.reason.message : String(result.reason),
        lastAttemptedProviders: config.providers.map((p) => p.name),
      });
    }
  }

  return {
    quotes,
    errors,
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Fetch a single asset, trying each provider in order with date validation.
 * Uses Supabase api_cache for caching.
 */
async function fetchSingleAsset(config: AssetConfig): Promise<FinancialQuote> {
  const cacheKey = `financial_${config.symbol}`;
  const ttl = CACHE_TTL_SECONDS[config.type];

  // 1. Check cache
  const cached = await getCachedQuote(cacheKey);
  if (cached && isCacheValid(cached)) {
    return cached.data;
  }

  // 2. Try each provider in order
  const attemptedProviders: string[] = [];

  for (const providerConfig of config.providers) {
    attemptedProviders.push(providerConfig.name);
    const fetchFn = PROVIDER_FETCHERS[providerConfig.name];

    if (!fetchFn) {
      console.warn(`[FinancialData] Unknown provider "${providerConfig.name}" for ${config.symbol}`);
      continue;
    }

    try {
      const raw = await fetchFn(providerConfig.ticker);

      // RULE 2: Validate freshness by date
      const freshnessError = validateFreshness(
        raw,
        config.maxStalenessHours,
        config.symbol,
        providerConfig.name,
      );
      if (freshnessError) {
        console.warn(`[FinancialData] ${freshnessError}`);
        continue; // Try next provider
      }

      // Validate price is a valid number
      const priceError = validatePrice(raw.price, config.symbol, providerConfig.name);
      if (priceError) {
        console.warn(`[FinancialData] ${priceError}`);
        continue;
      }

      // Build the validated quote
      const quote: FinancialQuote = {
        symbol: config.symbol,
        name: config.name,
        price: raw.price,
        change: raw.change,
        changePercent: raw.changePercent,
        currency: config.currency,
        unit: config.unit,
        source: raw.source,
        marketTime: raw.marketTime,
        fetchedAt: new Date().toISOString(),
        type: config.type,
        description: config.description,
        educationLink: config.educationLink,
      };

      // Cache the valid result
      await cacheQuote(cacheKey, quote, ttl);

      return quote;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[FinancialData] ${config.symbol} via ${providerConfig.name}: ${msg}`);
      Sentry.captureException(err, {
        tags: { asset: config.symbol, provider: providerConfig.name },
        level: 'warning',
      });
    }
  }

  // 3. All providers failed — do NOT return stale data (RULE 2)
  // Only use cache if it's less than 48h old (not 7 days — that risks showing very wrong prices)
  if (cached) {
    const cacheAge = Date.now() - new Date(cached.data.fetchedAt).getTime();
    const maxFallbackAge = 48 * 3600 * 1000; // 48 hours max
    if (cacheAge < maxFallbackAge) {
      console.warn(
        `[FinancialData] ${config.symbol}: all providers failed, using stale cache (age: ${Math.round(cacheAge / 3600000)}h)`,
      );
      return {
        ...cached.data,
        source: `${cached.data.source} (cache)`,
      };
    }
  }

  throw new Error(
    `All providers failed for ${config.symbol}: tried [${attemptedProviders.join(', ')}]`,
  );
}

// ── Cache helpers (Supabase api_cache table) ──────────────────

interface CacheEntry {
  data: FinancialQuote;
  expires_at: string;
  fetched_at: string;
}

async function getCachedQuote(key: string): Promise<CacheEntry | null> {
  try {
    const supabase = createServiceClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('api_cache')
      .select('data, expires_at, fetched_at')
      .eq('source', 'financial_data')
      .eq('key', key)
      .single();

    if (error || !data) return null;
    return data as CacheEntry;
  } catch {
    return null;
  }
}

function isCacheValid(entry: CacheEntry): boolean {
  return new Date(entry.expires_at) > new Date();
}

async function cacheQuote(key: string, quote: FinancialQuote, ttlSeconds: number): Promise<void> {
  try {
    const supabase = createServiceClient();
    if (!supabase) return;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

    await supabase.from('api_cache').upsert(
      {
        source: 'financial_data',
        key,
        data: quote as unknown as Record<string, unknown>,
        fetched_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        updated_at: now.toISOString(),
      },
      { onConflict: 'source,key' },
    );
  } catch (err) {
    Sentry.captureException(err, { tags: { cache: 'financial_data', key } });
  }
}

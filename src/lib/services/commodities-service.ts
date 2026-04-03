import { BaseDataService } from './base-service';

export interface CommodityPrice {
  name: string;
  symbol: string;
  price: number;
  unit: string;
  currency: string;
  change: number;
  changePercent: number;
  source: string;
  date: string;
}

export interface CommoditiesData {
  commodities: CommodityPrice[];
  date: string;
}

// Sanity-check ranges: [min, max] in USD for each commodity.
// These are wide bounds to catch obviously wrong contract data
// (e.g. a far-dated future returning $76 when spot is $109).
const PRICE_SANITY_RANGES: Record<string, [number, number]> = {
  oil: [40, 200],
  gold: [1500, 6000],
  uranium: [20, 200],
  cotton: [0.30, 2.00],
};

// Maximum age (in hours) for a price to be considered fresh.
const MAX_PRICE_AGE_HOURS = 48;

// World Bank commodity API indicators
const COMMODITY_INDICATORS: Record<string, { name: string; symbol: string; unit: string; wbCode: string; yahooTicker?: string }> = {
  oil: { name: 'Pétrole Brent', symbol: 'ICEEUR:BRN1!', unit: 'USD/baril', wbCode: 'CRUDE_BRENT', yahooTicker: 'BZ%3DF' },
  gold: { name: 'Or', symbol: 'XAU', unit: 'USD/once', wbCode: 'GOLD', yahooTicker: 'GC%3DF' },
  uranium: { name: 'Uranium', symbol: 'U3O8', unit: 'USD/lb', wbCode: 'URANIUM', yahooTicker: 'UX%3DF' },
  cotton: { name: 'Coton', symbol: 'CT', unit: 'USD/lb', wbCode: 'COTTON_A_INDX', yahooTicker: 'CT%3DF' },
};

export class CommoditiesService extends BaseDataService {
  protected source = 'commodities';
  protected defaultTTLSeconds = 3600; // 1h

  async fetch(): Promise<CommoditiesData> {
    const fetchPromises = Object.entries(COMMODITY_INDICATORS).map(async ([key, meta]) => {
      try {
        return await this.fetchCommodityWithValidation(key, meta);
      } catch {
        // Fallback: try Frankfurter for gold
        if (key === 'gold') {
          try {
            return await this.fetchGoldFromFrankfurter(meta);
          } catch { /* fall through */ }
        }
        // Fallback: try TradingEconomics scraping for oil
        if (key === 'oil') {
          try {
            return await this.fetchBrentFromTradingEconomics(meta);
          } catch { /* fall through */ }
        }
        return this.getFallbackPrice(key, meta);
      }
    });

    const results = await Promise.allSettled(fetchPromises);
    const commodities: CommodityPrice[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        commodities.push(result.value);
      }
    }

    return { commodities, date: new Date().toISOString() };
  }

  /**
   * Fetch a commodity price from Yahoo Finance with date and sanity validation.
   * Tries the primary ticker first, then falls back to alternative tickers if
   * the returned data is stale or fails sanity checks.
   */
  private async fetchCommodityWithValidation(
    key: string,
    meta: { name: string; symbol: string; unit: string; yahooTicker?: string },
  ): Promise<CommodityPrice> {
    // For Brent oil, try multiple Yahoo Finance approaches
    const tickersToTry: string[] = meta.yahooTicker ? [meta.yahooTicker] : [];
    if (key === 'oil') {
      // BZ=F is Brent continuous front-month on Yahoo
      // CL=F is WTI crude (backup reference)
      tickersToTry.push('BZ%3DF', 'CL%3DF');
      // Deduplicate
      const unique = Array.from(new Set(tickersToTry));
      tickersToTry.length = 0;
      tickersToTry.push(...unique);
    }

    let lastError: Error | null = null;

    for (const ticker of tickersToTry) {
      try {
        const result = await this.fetchFromYahoo({ ...meta, yahooTicker: ticker });

        // Validate freshness: regularMarketTime must be within MAX_PRICE_AGE_HOURS
        if (!this.isPriceFresh(result.date)) {
          console.warn(`[Commodities] ${key}: stale price from ticker ${ticker} (date: ${result.date})`);
          lastError = new Error(`Stale price for ${key} from ${ticker}`);
          continue;
        }

        // Sanity check: price must be in expected range
        const range = PRICE_SANITY_RANGES[key];
        if (range && (result.price < range[0] || result.price > range[1])) {
          console.warn(`[Commodities] ${key}: price $${result.price} outside sanity range [${range[0]}, ${range[1]}] from ticker ${ticker}`);
          lastError = new Error(`Price $${result.price} outside expected range for ${key}`);
          continue;
        }

        return result;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }

    throw lastError || new Error(`Failed to fetch ${key}`);
  }

  /**
   * Check if a price date is fresh (within MAX_PRICE_AGE_HOURS of now).
   */
  private isPriceFresh(dateStr: string): boolean {
    const priceDate = new Date(dateStr);
    if (isNaN(priceDate.getTime())) return false;
    const ageMs = Date.now() - priceDate.getTime();
    return ageMs >= 0 && ageMs < MAX_PRICE_AGE_HOURS * 3600 * 1000;
  }

  /**
   * Fetch a commodity price from Yahoo Finance chart API.
   * Returns the actual market timestamp from the response, not just Date.now().
   */
  private async fetchFromYahoo(meta: { name: string; symbol: string; unit: string; yahooTicker?: string }): Promise<CommodityPrice> {
    if (!meta.yahooTicker) throw new Error('No Yahoo ticker defined');

    // Use range=5d to ensure we get recent trading days even over weekends
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${meta.yahooTicker}?range=5d&interval=1d`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    if (!res.ok) throw new Error(`Yahoo Finance ${res.status}`);
    const json = await res.json();

    const result = json?.chart?.result?.[0];
    if (!result) throw new Error('No chart data');

    const price = result.meta?.regularMarketPrice;
    const previousClose = result.meta?.chartPreviousClose ?? result.meta?.previousClose;
    const regularMarketTime = result.meta?.regularMarketTime; // Unix timestamp

    if (!price) throw new Error('No price in response');

    // Use the actual market timestamp from Yahoo, not the current time
    const marketDate = regularMarketTime
      ? new Date(regularMarketTime * 1000).toISOString()
      : new Date().toISOString();

    const refPrice = previousClose ?? price;
    const change = Math.round((price - refPrice) * 100) / 100;
    const changePercent = refPrice !== 0
      ? Math.round(((price - refPrice) / refPrice) * 10000) / 100
      : 0;

    return {
      name: meta.name,
      symbol: meta.symbol,
      price: Math.round(price * 100) / 100,
      unit: meta.unit,
      currency: 'USD',
      change,
      changePercent,
      source: 'Yahoo Finance',
      date: marketDate,
    };
  }

  /**
   * Alternative source for Brent oil: TradingEconomics public API.
   */
  private async fetchBrentFromTradingEconomics(
    meta: { name: string; symbol: string; unit: string },
  ): Promise<CommodityPrice> {
    const url = 'https://api.tradingeconomics.com/markets/commodity?c=guest:guest&f=json';
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    if (!res.ok) throw new Error(`TradingEconomics ${res.status}`);
    const data = await res.json();

    // Find Brent crude entry
    const brent = Array.isArray(data)
      ? data.find((item: Record<string, unknown>) =>
          typeof item.Name === 'string' && item.Name.toLowerCase().includes('brent'))
      : null;

    if (!brent?.Last) throw new Error('No Brent data from TradingEconomics');

    const price = Number(brent.Last);
    const change = Number(brent.Daily || 0);
    const changePercent = Number(brent.DailyPercentual || 0);
    const dateStr = brent.Date || new Date().toISOString();

    if (!this.isPriceFresh(dateStr)) {
      throw new Error('Stale Brent data from TradingEconomics');
    }

    return {
      name: meta.name,
      symbol: meta.symbol,
      price: Math.round(price * 100) / 100,
      unit: meta.unit,
      currency: 'USD',
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      source: 'TradingEconomics',
      date: dateStr,
    };
  }

  /**
   * Fallback: gold price from Frankfurter/ECB.
   */
  private async fetchGoldFromFrankfurter(meta: { name: string; symbol: string; unit: string }): Promise<CommodityPrice> {
    const res = await fetch('https://api.frankfurter.dev/v1/latest?from=XAU&to=USD', {
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) throw new Error('Gold API failed');
    const data = await res.json();
    const price = data.rates?.USD;
    if (!price) throw new Error('No gold price');

    return {
      name: meta.name,
      symbol: meta.symbol,
      price,
      unit: meta.unit,
      currency: 'USD',
      change: 0,
      changePercent: 0,
      source: 'Frankfurter/ECB',
      date: data.date || new Date().toISOString(),
    };
  }

  /**
   * Last-resort fallback with static estimates.
   */
  private getFallbackPrice(key: string, meta: { name: string; symbol: string; unit: string }): CommodityPrice {
    const estimates: Record<string, { price: number; change: number; changePercent: number }> = {
      oil: { price: 109.00, change: 0, changePercent: 0 },
      gold: { price: 3100.00, change: 0, changePercent: 0 },
      uranium: { price: 65.00, change: 0, changePercent: 0 },
      cotton: { price: 0.68, change: 0, changePercent: 0 },
    };

    const est = estimates[key] || { price: 0, change: 0, changePercent: 0 };

    return {
      name: meta.name,
      symbol: meta.symbol,
      price: est.price,
      unit: meta.unit,
      currency: 'USD',
      change: est.change,
      changePercent: est.changePercent,
      source: 'Fallback',
      date: new Date().toISOString(),
    };
  }

  async getCommodities() {
    return this.getOrFetch('commodities_all', () => this.fetch());
  }
}

export const commoditiesService = new CommoditiesService();

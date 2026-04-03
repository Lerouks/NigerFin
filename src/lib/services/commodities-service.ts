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
        return await this.fetchFromYahoo(meta);
      } catch {
        // Fallback: try Frankfurter for gold
        if (key === 'gold') {
          try {
            return await this.fetchGoldFromFrankfurter(meta);
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
   * Fetch a commodity price from Yahoo Finance chart API.
   */
  private async fetchFromYahoo(meta: { name: string; symbol: string; unit: string; yahooTicker?: string }): Promise<CommodityPrice> {
    if (!meta.yahooTicker) throw new Error('No Yahoo ticker defined');

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${meta.yahooTicker}?range=2d&interval=1d`;
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

    if (!price) throw new Error('No price in response');

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
      date: new Date().toISOString(),
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
      oil: { price: 70.00, change: 0, changePercent: 0 },
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

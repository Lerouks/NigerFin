import { BaseDataService } from './base-service';

export interface IndexQuote {
  name: string;
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  date: string;
}

export interface IndicesData {
  quotes: IndexQuote[];
  date: string;
}

/**
 * Symbols map: internal symbol → Yahoo Finance ticker.
 */
const INDEX_SYMBOLS: Record<string, { ticker: string; name: string }> = {
  IXIC: { ticker: '%5EIXIC', name: 'Nasdaq Composite' },
  GSPC: { ticker: '%5EGSPC', name: 'S&P 500' },
  SXXP: { ticker: '%5ESTOXX', name: 'STOXX Europe 600' },
};

export class IndicesService extends BaseDataService {
  protected source = 'indices';
  protected defaultTTLSeconds = 900; // 15 min

  private async fetchQuote(symbol: string, meta: { ticker: string; name: string }): Promise<IndexQuote | null> {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${meta.ticker}?range=2d&interval=1d`;

    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });

    if (!res.ok) return null;
    const json = await res.json();

    const result = json?.chart?.result?.[0];
    if (!result) return null;

    const closePrices = result.indicators?.quote?.[0]?.close;
    const regularMarketPrice = result.meta?.regularMarketPrice;
    const previousClose = result.meta?.chartPreviousClose ?? result.meta?.previousClose;

    const price = regularMarketPrice ?? (closePrices ? closePrices[closePrices.length - 1] : null);
    if (!price) return null;

    const refPrice = previousClose ?? (closePrices && closePrices.length >= 2 ? closePrices[closePrices.length - 2] : price);
    const change = Math.round((price - refPrice) * 100) / 100;
    const changePercent = refPrice !== 0 ? Math.round(((price - refPrice) / refPrice) * 10000) / 100 : 0;

    return {
      name: meta.name,
      symbol,
      price: Math.round(price * 100) / 100,
      change,
      changePercent,
      date: new Date().toISOString(),
    };
  }

  async fetch(): Promise<IndicesData> {
    const entries = Object.entries(INDEX_SYMBOLS);
    const results = await Promise.allSettled(
      entries.map(([symbol, meta]) => this.fetchQuote(symbol, meta))
    );

    const quotes: IndexQuote[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        quotes.push(result.value);
      }
    }

    if (quotes.length === 0) throw new Error('No index data returned from Yahoo Finance');

    return { quotes, date: new Date().toISOString() };
  }

  async getIndices() {
    return this.getOrFetch('global_indices', () => this.fetch());
  }
}

export const indicesService = new IndicesService();

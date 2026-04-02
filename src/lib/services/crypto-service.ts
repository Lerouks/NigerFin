import { BaseDataService } from './base-service';

export interface CryptoPrice {
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  marketCap: number;
  volume24h: number;
  date: string;
}

export interface CryptoData {
  prices: CryptoPrice[];
  date: string;
}

const CRYPTO_IDS: Record<string, { name: string; symbol: string }> = {
  bitcoin: { name: 'Bitcoin', symbol: 'BTC' },
  ethereum: { name: 'Ethereum', symbol: 'ETH' },
};

export class CryptoService extends BaseDataService {
  protected source = 'crypto';
  protected defaultTTLSeconds = 300; // 5 min — crypto moves fast

  async fetch(): Promise<CryptoData> {
    const ids = Object.keys(CRYPTO_IDS).join(',');
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`,
      { signal: AbortSignal.timeout(10000) }
    );

    if (!res.ok) throw new Error(`CoinGecko API ${res.status}`);
    const data = await res.json();

    const prices: CryptoPrice[] = [];
    for (const [id, meta] of Object.entries(CRYPTO_IDS)) {
      const coin = data[id];
      if (!coin) continue;

      const price = coin.usd ?? 0;
      const changePercent = coin.usd_24h_change ?? 0;
      const change = price * (changePercent / 100);

      prices.push({
        name: meta.name,
        symbol: meta.symbol,
        price,
        change24h: Math.round(change * 100) / 100,
        changePercent24h: Math.round(changePercent * 100) / 100,
        marketCap: coin.usd_market_cap ?? 0,
        volume24h: coin.usd_24h_vol ?? 0,
        date: new Date().toISOString(),
      });
    }

    if (prices.length === 0) throw new Error('No crypto data returned');

    return { prices, date: new Date().toISOString() };
  }

  async getCryptoPrices() {
    return this.getOrFetch('crypto_prices', () => this.fetch());
  }
}

export const cryptoService = new CryptoService();

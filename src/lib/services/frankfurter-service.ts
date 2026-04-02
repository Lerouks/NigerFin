import { BaseDataService } from './base-service';

export interface ForexRate {
  base: string;
  target: string;
  rate: number;
  rateInXOF: number;
  change: number;
  changePercent: number;
  date: string;
}

export interface ForexData {
  rates: ForexRate[];
  baseCurrency: string;
  date: string;
}

// EUR/XOF is fixed at 655.957
const EUR_XOF_RATE = 655.957;

const TARGET_CURRENCIES = ['USD', 'GBP', 'CHF', 'JPY', 'CAD', 'CNY', 'NGN', 'GHS', 'MAD', 'ZAR'];

export class FrankfurterService extends BaseDataService {
  protected source = 'frankfurter';
  protected defaultTTLSeconds = 3600; // 1h

  async fetch(): Promise<ForexData> {
    // Get latest rates and previous day
    const [latestRes, previousRes] = await Promise.all([
      fetch('https://api.frankfurter.dev/v1/latest?base=EUR', { signal: AbortSignal.timeout(10000) }),
      fetch('https://api.frankfurter.dev/v1/latest?base=EUR&amount=1', { signal: AbortSignal.timeout(10000) }),
    ]);

    if (!latestRes.ok) throw new Error(`Frankfurter API ${latestRes.status}`);
    const latest = await latestRes.json();

    let previousRates: Record<string, number> = {};
    if (previousRes.ok) {
      const prev = await previousRes.json();
      previousRates = prev.rates || {};
    }

    const rates: ForexRate[] = [];

    // EUR/XOF (fixed rate)
    rates.push({
      base: 'EUR',
      target: 'XOF',
      rate: 1,
      rateInXOF: EUR_XOF_RATE,
      change: 0,
      changePercent: 0,
      date: latest.date,
    });

    // Convert each currency to XOF
    for (const currency of TARGET_CURRENCIES) {
      const eurRate = latest.rates?.[currency];
      if (!eurRate) continue;

      const xofRate = EUR_XOF_RATE / eurRate;
      const prevEurRate = previousRates[currency] || eurRate;
      const prevXofRate = EUR_XOF_RATE / prevEurRate;
      const change = xofRate - prevXofRate;
      const changePercent = prevXofRate !== 0 ? (change / prevXofRate) * 100 : 0;

      rates.push({
        base: currency,
        target: 'XOF',
        rate: eurRate,
        rateInXOF: Math.round(xofRate * 100) / 100,
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 1000) / 1000,
        date: latest.date,
      });
    }

    return { rates, baseCurrency: 'XOF', date: latest.date };
  }

  async getForex() {
    return this.getOrFetch('forex_xof', () => this.fetch());
  }
}

export const frankfurterService = new FrankfurterService();

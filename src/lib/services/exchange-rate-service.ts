import { BaseDataService } from './base-service';
import type { ForexData, ForexRate } from './frankfurter-service';

const EUR_XOF_RATE = 655.957;

export class ExchangeRateService extends BaseDataService {
  protected source = 'exchange_rate_api';
  protected defaultTTLSeconds = 3600; // 1h

  async fetch(): Promise<ForexData> {
    // Uses the free tier of ExchangeRate-API (no key required for open endpoint)
    const res = await fetch('https://open.er-api.com/v6/latest/EUR', {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`ExchangeRate-API ${res.status}`);
    const json = await res.json();

    if (json.result !== 'success') throw new Error('ExchangeRate-API returned error');

    const eurRates = json.rates || {};
    const targetCurrencies = ['USD', 'GBP', 'CHF', 'JPY', 'CAD', 'CNY', 'NGN', 'GHS', 'MAD', 'ZAR'];

    const rates: ForexRate[] = [
      {
        base: 'EUR',
        target: 'XOF',
        rate: 1,
        rateInXOF: EUR_XOF_RATE,
        change: 0,
        changePercent: 0,
        date: json.time_last_update_utc?.split(' ').slice(0, 4).join(' ') || new Date().toISOString(),
      },
    ];

    for (const currency of targetCurrencies) {
      const eurRate = eurRates[currency];
      if (!eurRate) continue;

      const xofRate = EUR_XOF_RATE / eurRate;

      rates.push({
        base: currency,
        target: 'XOF',
        rate: eurRate,
        rateInXOF: Math.round(xofRate * 100) / 100,
        change: 0, // Fallback doesn't provide historical for delta
        changePercent: 0,
        date: json.time_last_update_utc || new Date().toISOString(),
      });
    }

    return { rates, baseCurrency: 'XOF', date: json.time_last_update_utc || new Date().toISOString() };
  }

  async getForex() {
    return this.getOrFetch('forex_xof_fallback', () => this.fetch());
  }
}

export const exchangeRateService = new ExchangeRateService();

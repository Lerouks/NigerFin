import { BaseDataService } from './base-service';

export interface WorldBankIndicator {
  indicator: string;
  country: string;
  year: number;
  value: number | null;
}

export interface MacroData {
  gdp: WorldBankIndicator[];
  gdpGrowth: WorldBankIndicator[];
  gdpPerCapita: WorldBankIndicator[];
  inflation: WorldBankIndicator[];
  debt: WorldBankIndicator[];
  population: WorldBankIndicator[];
}

const INDICATORS: Record<string, string> = {
  gdp: 'NY.GDP.MKTP.CD',
  gdpGrowth: 'NY.GDP.MKTP.KD.ZG',
  gdpPerCapita: 'NY.GDP.PCAP.CD',
  inflation: 'FP.CPI.TOTL.ZG',
  debt: 'GC.DOD.TOTL.GD.ZS',
  population: 'SP.POP.TOTL',
};

export class WorldBankService extends BaseDataService {
  protected source = 'world_bank';
  protected defaultTTLSeconds = 86400; // 24h

  async fetch(country: string = 'NER'): Promise<MacroData> {
    const result: Partial<MacroData> = {};
    const entries = Object.entries(INDICATORS);

    const responses = await Promise.allSettled(
      entries.map(async ([key, indicator]) => {
        const url = `https://api.worldbank.org/v2/country/${country}/indicator/${indicator}?format=json&per_page=20&date=2015:2025`;
        const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (!res.ok) throw new Error(`World Bank API ${res.status}`);
        const json = await res.json();
        const records: WorldBankIndicator[] = (json[1] || [])
          .filter((r: { value: number | null }) => r.value !== null)
          .map((r: { indicator: { id: string }; country: { id: string }; date: string; value: number }) => ({
            indicator: r.indicator.id,
            country: r.country.id,
            year: parseInt(r.date),
            value: r.value,
          }));
        return { key, records };
      })
    );

    for (const res of responses) {
      if (res.status === 'fulfilled') {
        (result as Record<string, WorldBankIndicator[]>)[res.value.key] = res.value.records;
      }
    }

    return {
      gdp: result.gdp || [],
      gdpGrowth: result.gdpGrowth || [],
      gdpPerCapita: result.gdpPerCapita || [],
      inflation: result.inflation || [],
      debt: result.debt || [],
      population: result.population || [],
    };
  }

  async getMacro(country: string = 'NER') {
    return this.getOrFetch(`macro_${country}`, () => this.fetch(country));
  }
}

export const worldBankService = new WorldBankService();

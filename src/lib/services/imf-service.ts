import { BaseDataService } from './base-service';

export interface IMFIndicator {
  indicator: string;
  country: string;
  year: number;
  value: number | null;
}

export interface IMFData {
  realGDPGrowth: IMFIndicator[];
  inflationRate: IMFIndicator[];
  currentAccountBalance: IMFIndicator[];
  governmentRevenue: IMFIndicator[];
  governmentExpenditure: IMFIndicator[];
}

const IMF_INDICATORS: Record<string, string> = {
  realGDPGrowth: 'NGDP_RPCH',
  inflationRate: 'PCPIPCH',
  currentAccountBalance: 'BCA_NGDPD',
  governmentRevenue: 'GGR_NGDP',
  governmentExpenditure: 'GGX_NGDP',
};

export class IMFService extends BaseDataService {
  protected source = 'imf';
  protected defaultTTLSeconds = 86400; // 24h

  async fetch(country: string = 'NER'): Promise<IMFData> {
    const result: Partial<IMFData> = {};

    const responses = await Promise.allSettled(
      Object.entries(IMF_INDICATORS).map(async ([key, indicator]) => {
        const url = `https://www.imf.org/external/datamapper/api/v1/${indicator}/${country}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
        if (!res.ok) throw new Error(`IMF API ${res.status}`);
        const json = await res.json();

        const values = json?.values?.[indicator]?.[country] || {};
        const records: IMFIndicator[] = Object.entries(values)
          .filter(([, v]) => v !== null && v !== undefined)
          .map(([year, value]) => ({
            indicator,
            country,
            year: parseInt(year),
            value: value as number,
          }))
          .sort((a, b) => b.year - a.year);

        return { key, records };
      })
    );

    for (const res of responses) {
      if (res.status === 'fulfilled') {
        (result as Record<string, IMFIndicator[]>)[res.value.key] = res.value.records;
      }
    }

    return {
      realGDPGrowth: result.realGDPGrowth || [],
      inflationRate: result.inflationRate || [],
      currentAccountBalance: result.currentAccountBalance || [],
      governmentRevenue: result.governmentRevenue || [],
      governmentExpenditure: result.governmentExpenditure || [],
    };
  }

  async getMacro(country: string = 'NER') {
    return this.getOrFetch(`imf_macro_${country}`, () => this.fetch(country));
  }
}

export const imfService = new IMFService();

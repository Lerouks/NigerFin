import { BaseDataService } from './base-service';

export interface ECOWASCountry {
  name: string;
  code: string;
  capital: string;
  population: number;
  area: number;
  currencies: Record<string, { name: string; symbol: string }>;
  languages: Record<string, string>;
  flags: { png: string; svg: string };
  region: string;
  subregion: string;
}

export interface ECOWASData {
  countries: ECOWASCountry[];
  totalPopulation: number;
  totalArea: number;
  memberCount: number;
}

// ECOWAS member country codes (alpha-3)
const ECOWAS_CODES = [
  'BEN', 'BFA', 'CPV', 'CIV', 'GMB', 'GHA', 'GIN', 'GNB',
  'LBR', 'MLI', 'NER', 'NGA', 'SEN', 'SLE', 'TGO',
];

export class ECOWASService extends BaseDataService {
  protected source = 'ecowas';
  protected defaultTTLSeconds = 604800; // 7 days

  async fetch(): Promise<ECOWASData> {
    const codes = ECOWAS_CODES.join(',');
    const res = await fetch(`https://restcountries.com/v3.1/alpha?codes=${codes}&fields=name,cca3,capital,population,area,currencies,languages,flags,region,subregion`, {
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`REST Countries (ECOWAS) API ${res.status}`);
    const json = await res.json();

    const countries: ECOWASCountry[] = (json as Array<Record<string, unknown>>).map((c: Record<string, unknown>) => ({
      name: (c.name as Record<string, string>)?.common || '',
      code: c.cca3 as string,
      capital: ((c.capital as string[]) || [])[0] || '',
      population: c.population as number || 0,
      area: c.area as number || 0,
      currencies: c.currencies as Record<string, { name: string; symbol: string }> || {},
      languages: c.languages as Record<string, string> || {},
      flags: c.flags as { png: string; svg: string },
      region: c.region as string || '',
      subregion: c.subregion as string || '',
    }));

    const totalPopulation = countries.reduce((sum, c) => sum + c.population, 0);
    const totalArea = countries.reduce((sum, c) => sum + c.area, 0);

    return { countries, totalPopulation, totalArea, memberCount: countries.length };
  }

  async getRegion() {
    return this.getOrFetch('ecowas_region', () => this.fetch(), 604800);
  }
}

export const ecowasService = new ECOWASService();

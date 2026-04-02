import { BaseDataService } from './base-service';

export interface CountryData {
  name: { common: string; official: string; nativeName: Record<string, { common: string; official: string }> };
  capital: string[];
  region: string;
  subregion: string;
  population: number;
  area: number;
  languages: Record<string, string>;
  currencies: Record<string, { name: string; symbol: string }>;
  borders: string[];
  flag: string;
  flags: { png: string; svg: string; alt: string };
  coatOfArms: { png: string; svg: string };
  maps: { googleMaps: string; openStreetMaps: string };
  timezones: string[];
  continents: string[];
  latlng: number[];
  landlocked: boolean;
  independent: boolean;
  unMember: boolean;
  gini: Record<string, number>;
  demonyms: Record<string, { m: string; f: string }>;
}

export class RestCountriesService extends BaseDataService {
  protected source = 'rest_countries';
  protected defaultTTLSeconds = 604800; // 7 days

  async fetch(countryCode: string = 'NER'): Promise<CountryData> {
    const res = await fetch(`https://restcountries.com/v3.1/alpha/${countryCode}`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`REST Countries API ${res.status}`);
    const json = await res.json();
    return json[0] as CountryData;
  }

  async getCountry(countryCode: string = 'NER') {
    return this.getOrFetch(`country_${countryCode}`, () => this.fetch(countryCode), 604800);
  }
}

export const restCountriesService = new RestCountriesService();

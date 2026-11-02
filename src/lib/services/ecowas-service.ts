import { BaseDataService } from './base-service';
import { lireReponsePays, RAISON_REST_COUNTRIES_RETIREE } from './rest-countries-service';

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
//
// NOTE : le Burkina Faso, le Mali et le Niger ont quitté la CEDEAO, retrait
// effectif le 29 janvier 2025. Cette liste les compte encore. À trancher avant
// de rebrancher une source : CEDEAO à douze membres, ou périmètre renommé.
const ECOWAS_CODES = [
  'BEN', 'BFA', 'CPV', 'CIV', 'GMB', 'GHA', 'GIN', 'GNB',
  'LBR', 'MLI', 'NER', 'NGA', 'SEN', 'SLE', 'TGO',
];

const CONTEXTE = 'REST Countries (CEDEAO)';

/** Nombre strictement positif, sinon null : une population ou une superficie nulle n'existe pas. */
function positif(valeur: unknown): number | null {
  return typeof valeur === 'number' && Number.isFinite(valeur) && valeur > 0 ? valeur : null;
}

/**
 * Convertit une fiche brute en pays CEDEAO, ou échoue.
 *
 * Avant, une population ou une superficie absente devenait 0 (`|| 0`), et le
 * total régional s'en trouvait faussé sans que rien ne le signale.
 */
function versPays(fiche: Record<string, unknown>): ECOWASCountry {
  const code = typeof fiche.cca3 === 'string' ? fiche.cca3 : '';
  const nom = fiche.name as { common?: unknown } | undefined;
  const population = positif(fiche.population);
  const area = positif(fiche.area);
  if (!code || typeof nom?.common !== 'string' || population === null || area === null) {
    throw new Error(`${CONTEXTE} : fiche pays illisible (${code || 'code absent'})`);
  }

  const flags = fiche.flags as { png?: unknown; svg?: unknown } | undefined;
  return {
    name: nom.common,
    code,
    capital: Array.isArray(fiche.capital) && typeof fiche.capital[0] === 'string' ? fiche.capital[0] : '',
    population,
    area,
    currencies: fiche.currencies as Record<string, { name: string; symbol: string }> || {},
    languages: fiche.languages as Record<string, string> || {},
    flags: {
      png: typeof flags?.png === 'string' ? flags.png : '',
      svg: typeof flags?.svg === 'string' ? flags.svg : '',
    },
    region: fiche.region as string || '',
    subregion: fiche.subregion as string || '',
  };
}

export class ECOWASService extends BaseDataService {
  protected source = 'ecowas';
  protected defaultTTLSeconds = 604800; // 7 days
  // Même fournisseur, même retrait de la v3.1 : la source n'est plus appelée.
  // fetch() reste en place et couvert par ses tests, prêt pour une vraie source.
  protected readonly nonBranchee: string | null = RAISON_REST_COUNTRIES_RETIREE;

  async fetch(): Promise<ECOWASData> {
    const codes = ECOWAS_CODES.join(',');
    const res = await fetch(`https://restcountries.com/v3.1/alpha?codes=${codes}&fields=name,cca3,capital,population,area,currencies,languages,flags,region,subregion`, {
      signal: AbortSignal.timeout(15000),
    });
    const fiches = await lireReponsePays(res, CONTEXTE);
    const countries = fiches.map(versPays);

    // Un total régional calculé sur une liste incomplète serait un chiffre faux.
    const manquants = ECOWAS_CODES.filter((code) => !countries.some((c) => c.code === code));
    if (manquants.length > 0) {
      throw new Error(`${CONTEXTE} : réponse incomplète, il manque ${manquants.join(', ')}`);
    }

    const totalPopulation = countries.reduce((sum, c) => sum + c.population, 0);
    const totalArea = countries.reduce((sum, c) => sum + c.area, 0);

    return { countries, totalPopulation, totalArea, memberCount: countries.length };
  }

  async getRegion() {
    return this.getOrFetch('ecowas_region', () => this.fetch(), 604800);
  }
}

export const ecowasService = new ECOWASService();

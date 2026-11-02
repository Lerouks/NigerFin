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

function estObjet(valeur: unknown): valeur is Record<string, unknown> {
  return typeof valeur === 'object' && valeur !== null && !Array.isArray(valeur);
}

/**
 * Lit une réponse de REST Countries et n'accepte qu'une liste de fiches pays.
 *
 * Le code supposait qu'une réponse 200 contenait forcément un tableau. Ce n'est
 * plus vrai : le fournisseur a retiré ses versions v1 à v4, dont la v3.1 que ce
 * site appelle. Chaque requête est redirigée (301) vers un fichier fixe qui
 * répond 200 avec ce corps, constaté le 2 novembre 2026 :
 *
 *   { "success": false, "data": null,
 *     "errors": [{ "message": "This API version has been deprecated. ..." }] }
 *
 * Conséquences avant cette lecture stricte : la CEDEAO appelait `.map` sur cet
 * objet et plantait (« (intermediate value).map is not a function », chaque
 * jour depuis le 13 juin 2026). La fiche Niger, elle, lisait `json[0]`,
 * c'est-à-dire `undefined` : le journal de santé notait un succès, et le cache
 * gardait l'ancienne fiche en lui donnant la date du jour.
 *
 * Désormais, tout ce qui n'est pas une liste de fiches est refusé avec un message
 * clair, qui reprend celui du fournisseur quand il en donne un.
 */
export async function lireReponsePays(
  res: Response,
  contexte: string,
): Promise<Array<Record<string, unknown>>> {
  if (!res.ok) throw new Error(`${contexte} : HTTP ${res.status}`);

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new Error(`${contexte} : la réponse n'est pas du JSON`);
  }

  if (Array.isArray(json)) {
    const fiches = json.filter(estObjet);
    if (fiches.length !== json.length) {
      throw new Error(`${contexte} : réponse illisible, un élément de la liste n'est pas une fiche pays`);
    }
    return fiches;
  }

  if (estObjet(json) && json.success === false) {
    const messages = Array.isArray(json.errors)
      ? json.errors.flatMap((e) => (estObjet(e) && typeof e.message === 'string' ? [e.message] : []))
      : [];
    const detail = messages.length > 0 ? ` : ${messages.join(' ; ')}` : '';
    throw new Error(`${contexte} : le fournisseur refuse la requête${detail}`);
  }

  throw new Error(`${contexte} : réponse inattendue, une liste de pays était attendue`);
}

/**
 * Pourquoi REST Countries est déclaré non branché (voir source-non-branchee.ts),
 * pour la fiche Niger comme pour la CEDEAO.
 *
 * Seule la v5 du fournisseur répond encore, et elle exige un compte et une clé
 * d'API : la brancher est une décision, pas un correctif. En attendant, la fiche
 * Niger s'en tient aux faits saisis en base (capitale, superficie) et à la
 * Banque mondiale (population), et la mention « Source : REST Countries »
 * disparaît, au lieu d'afficher la date du jour sur une fiche que le
 * fournisseur ne sert plus depuis juin.
 *
 * Le texte s'affiche tel quel dans l'écran Statut des API, d'où les espaces
 * insécables (\u00a0) avant le deux-points, dans les guillemets et entre le
 * jour et le mois.
 */
export const RAISON_REST_COUNTRIES_RETIREE =
  'restcountries.com a retiré son API v3.1\u00a0: chaque requête reçoit «\u00a0This API version '
  + 'has been deprecated\u00a0» sans aucune donnée (première erreur le 13\u00a0juin 2026). La v5 '
  + 'exige un compte et une clé d\'API.';

export class RestCountriesService extends BaseDataService {
  protected source = 'rest_countries';
  protected defaultTTLSeconds = 604800; // 7 days
  protected readonly nonBranchee: string | null = RAISON_REST_COUNTRIES_RETIREE;

  async fetch(countryCode: string = 'NER'): Promise<CountryData> {
    const contexte = `REST Countries (${countryCode})`;
    const res = await fetch(`https://restcountries.com/v3.1/alpha/${countryCode}`, {
      signal: AbortSignal.timeout(10000),
    });
    const fiches = await lireReponsePays(res, contexte);

    // Une liste vide, ou la fiche d'un autre pays, n'est pas la donnée demandée.
    const fiche = fiches.find((f) => f.cca3 === countryCode);
    if (!fiche) {
      throw new Error(`${contexte} : le pays demandé est absent de la réponse`);
    }
    return fiche as unknown as CountryData;
  }

  async getCountry(countryCode: string = 'NER') {
    return this.getOrFetch(`country_${countryCode}`, () => this.fetch(countryCode), 604800);
  }
}

export const restCountriesService = new RestCountriesService();

/**
 * Mapping pays -> code ISO alpha-2 -> nom francais lisible.
 * Utilise par CountryFlag pour afficher le drapeau et l'aria-label.
 *
 * Les drapeaux SVG correspondants vivent dans public/flags/{code}.svg
 * (source : flagcdn.com, MIT). Le fallback "world" (drapeau ONU) est utilise
 * quand aucun pays n'est detecte dans une chaine d'actionnariat.
 */

export type CountryCode =
  | 'NE' // Niger
  | 'FR' // France
  | 'CN' // Chine
  | 'MA' // Maroc
  | 'BJ' // Benin
  | 'US' // USA
  | 'CM' // Cameroun
  | 'SN' // Senegal
  | 'CI' // Cote d'Ivoire
  | 'BF' // Burkina Faso
  | 'ML' // Mali
  | 'DZ' // Algerie
  | 'NG' // Nigeria
  | 'TG' // Togo
  | 'GH' // Ghana
  | 'WORLD'; // fallback international

export interface CountryInfo {
  code: CountryCode;
  name: string;
}

export const COUNTRIES: Record<CountryCode, CountryInfo> = {
  NE: { code: 'NE', name: 'Niger' },
  FR: { code: 'FR', name: 'France' },
  CN: { code: 'CN', name: 'Chine' },
  MA: { code: 'MA', name: 'Maroc' },
  BJ: { code: 'BJ', name: 'Benin' },
  US: { code: 'US', name: 'Etats-Unis' },
  CM: { code: 'CM', name: 'Cameroun' },
  SN: { code: 'SN', name: 'Senegal' },
  CI: { code: 'CI', name: "Cote d'Ivoire" },
  BF: { code: 'BF', name: 'Burkina Faso' },
  ML: { code: 'ML', name: 'Mali' },
  DZ: { code: 'DZ', name: 'Algerie' },
  NG: { code: 'NG', name: 'Nigeria' },
  TG: { code: 'TG', name: 'Togo' },
  GH: { code: 'GH', name: 'Ghana' },
  WORLD: { code: 'WORLD', name: 'International' },
};

/**
 * Renvoie l'URL relative du SVG drapeau (a passer a next/image ou <img>).
 */
export function getFlagSrc(code: CountryCode): string {
  return `/flags/${code.toLowerCase()}.svg`;
}

/**
 * Pattern de detection pays par mots-cles. Ordre = priorite.
 * "Nigeria" doit etre teste AVANT "Niger" pour eviter le sous-string match.
 * Les regex sont insensibles a la casse et tolerantes aux accents.
 */
const COUNTRY_PATTERNS: ReadonlyArray<{ code: CountryCode; pattern: RegExp }> = [
  { code: 'NG', pattern: /\b(?:nigeria|nigerian|first\s*bank\s*nigeria)\b/i },
  { code: 'NE', pattern: /\b(?:niger(?!ia)|nig[eé]rien|[ée]tat\s+(?:du\s+)?niger)\b/i },
  { code: 'FR', pattern: /\b(?:france|fran[cç]ais|orano|areva|bollor[eé]|total\s*energies?|engie|orange\s*group|axa|bnp|cr[eé]dit\s+agricole|soci[eé]t[eé]\s+g[eé]n[eé]rale)\b/i },
  { code: 'CN', pattern: /\b(?:chine|chinois|cnpc|sinopec|cnnc|petrochina|china\s+nuclear|china\s+national)\b/i },
  { code: 'MA', pattern: /\b(?:maroc|marocain|attijari[a-z]*|bcp|ocp|bank\s+of\s+africa|boa)\b/i },
  { code: 'SN', pattern: /\b(?:s[eé]n[eé]gal|sonatel|bicis|cbao)\b/i },
  { code: 'CI', pattern: /\b(?:c[oô]te\s+d['']?ivoire|ivoirien|sgbci|sib)\b/i },
  { code: 'BF', pattern: /\b(?:burkina\s+faso|burkinab[eé])\b/i },
  { code: 'ML', pattern: /\b(?:mali(?!enne)|malien)\b/i },
  { code: 'DZ', pattern: /\b(?:alg[eé]rie|alg[eé]rien|sonatrach)\b/i },
  { code: 'TG', pattern: /\b(?:togo(?!lais)?|togolais|ecobank)\b/i },
  { code: 'GH', pattern: /\b(?:ghana(?!ien)|ghan[eé]en)\b/i },
  { code: 'BJ', pattern: /\b(?:b[eé]nin(?!ois)?|b[eé]ninois|port\s+de\s+cotonou)\b/i },
  { code: 'CM', pattern: /\b(?:cameroun|camerounais)\b/i },
  { code: 'US', pattern: /\b(?:[eé]tats[\s-]+unis|am[eé]ricain|usa\b|exxon\s*mobil|chevron|citigroup)\b/i },
];

/**
 * Detecte le pays principal mentionne dans une chaine.
 * Renvoie WORLD si aucun pattern ne matche.
 */
export function detectCountry(text: string): CountryCode {
  if (!text) return 'WORLD';
  for (const { code, pattern } of COUNTRY_PATTERNS) {
    if (pattern.test(text)) return code;
  }
  return 'WORLD';
}

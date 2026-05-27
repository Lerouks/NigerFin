/**
 * Parse une chaine libre d'actionnariat (champ `ownership` de strategic_enterprises)
 * en une liste structuree { actionnaire, pourcentage, pays detecte }.
 *
 * Exemples de strings reels :
 *   "Etat du Niger 100%"
 *   "Orano (ex-Areva) 63,4% / Etat du Niger 36,6%"
 *   "Orange Group 70% + Etat du Niger 30%"
 *   "Etat du Niger 100% (en cours de privatisation)"
 *
 * Le parsing est tolerant : si aucun pourcentage trouve, on garde quand meme
 * le label avec share = null. Si la chaine est vide ou null, on renvoie [].
 */

import { detectCountry, type CountryCode } from './country-flags';

export interface OwnershipShare {
  label: string;
  share: number | null;
  country: CountryCode;
}

/**
 * Separateurs entre actionnaires dans une chaine.
 * On split d'abord sur ces tokens avant d'extraire le pourcentage de chaque segment.
 */
const SEGMENT_SEPARATORS = /\s*(?:\/|\+|;|\bet\b|&)\s*/i;

/**
 * Regex pour extraire un pourcentage. Tolerant : accepte "63,4%", "63.4 %", "63%".
 */
const PERCENT_REGEX = /(\d+(?:[.,]\d+)?)\s*%/;

/**
 * Nettoie un segment de ses parenthese explicatives et de son pourcentage.
 * "Orano (ex-Areva) 63,4%" -> "Orano"
 */
function cleanLabel(segment: string): string {
  return segment
    .replace(PERCENT_REGEX, '')
    .replace(/\([^)]*\)/g, '')
    .trim()
    .replace(/\s+/g, ' ');
}

export function parseOwnership(ownership: string | null | undefined): OwnershipShare[] {
  if (!ownership || typeof ownership !== 'string') return [];

  const trimmed = ownership.trim();
  if (!trimmed) return [];

  const segments = trimmed.split(SEGMENT_SEPARATORS).filter((s) => s.trim().length > 0);
  if (segments.length === 0) return [];

  return segments.map((segment) => {
    const percentMatch = segment.match(PERCENT_REGEX);
    const share = percentMatch?.[1] ? parseFloat(percentMatch[1].replace(',', '.')) : null;
    const label = cleanLabel(segment);
    const country = detectCountry(segment);
    return { label, share, country };
  });
}

/**
 * Renvoie le pays principal d'une chaine d'actionnariat (celui qui detient la
 * plus grande part). Si plusieurs ex-aequo ou aucun pourcentage, renvoie le
 * premier pays detecte. Utile pour le drapeau unique d'un EnterpriseListItem.
 */
export function getMajorityCountry(ownership: string | null | undefined): CountryCode {
  const shares = parseOwnership(ownership);
  if (shares.length === 0) return 'WORLD';
  const sorted = [...shares].sort((a, b) => (b.share ?? 0) - (a.share ?? 0));
  return sorted[0]?.country ?? 'WORLD';
}

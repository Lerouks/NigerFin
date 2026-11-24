/**
 * Les chiffres de la page Niger, « Chiffres et entreprises » (24/11/2026).
 *
 * Règle de Raouf : rien ne s'affiche qu'on ne puisse sourcer et dater. Tous
 * ces chiffres viennent de l'Institut national de la statistique (INS) :
 * comptes économiques rapides 2025 (publiés en avril 2026) et note de
 * conjoncture du 4e trimestre 2025 (mars 2026). Le plafond de dette est le
 * critère de convergence de l'UEMOA.
 *
 * Fichier distinct de ins-indicators.ts, qui sert aussi au simulateur
 * « Indices économiques » (à ne jamais toucher). À relire à chaque nouvelle
 * publication de l'INS, puis changer NIGER_CHIFFRES_MIS_A_JOUR.
 */

/** Date de la dernière vérification des chiffres de ce fichier. */
export const NIGER_CHIFFRES_MIS_A_JOUR = '2026-11-24';

const NB = '\u00a0';
const FINE = '\u202f';
const MOINS = '\u2212';

export interface ChiffreCle {
  libelle: string;
  valeur: string;
  /** Ce que compte la valeur, ou la valeur de l'année précédente. */
  complement: string;
  source: string;
}

export const CHIFFRES_CLES: ChiffreCle[] = [
  { libelle: 'PIB 2025', valeur: `12${FINE}354`, complement: 'milliards de FCFA', source: `INS, avril${NB}2026` },
  { libelle: 'Croissance 2025', valeur: `+6,9${NB}%`, complement: `8,3${NB}% en 2024`, source: `INS, avril${NB}2026` },
  { libelle: 'Inflation 2025', valeur: `${MOINS}4,7${NB}%`, complement: `+9,1${NB}% en 2024`, source: 'moyenne annuelle, INS' },
  { libelle: 'Pétrole brut', valeur: `89${NB}%`, complement: 'des exportations', source: `INS, fin${NB}2025` },
];

export interface PartDuPib {
  libelle: string;
  /** En pourcentage du PIB 2025. */
  part: number;
}

/** Ce que produit le pays : secteurs primaire, tertiaire et secondaire (INS 2025). */
export const SECTEURS_PIB: PartDuPib[] = [
  { libelle: 'Agriculture et élevage', part: 47.4 },
  { libelle: 'Services', part: 33.6 },
  { libelle: 'Mines, industrie, BTP', part: 19.0 },
];

/** Dette publique 2025 en pourcentage du PIB (INS) et plafond de l'UEMOA. */
export const DETTE_PUBLIQUE = { exterieure: 25.7, interieure: 22.2, totale: 47.9, plafondUemoa: 70 };

export interface Evolution {
  libelle: string;
  avant: string;
  apres: string;
  verdict: string;
  precision?: string;
}

/** De 2024 à 2025 (INS). */
export const EN_UN_AN: Evolution[] = [
  { libelle: 'Croissance', avant: `8,3${NB}%`, apres: `6,9${NB}%`, verdict: 'Elle ralentit' },
  { libelle: 'Inflation', avant: `+9,1${NB}%`, apres: `${MOINS}4,7${NB}%`, verdict: 'Les prix baissent' },
  {
    libelle: 'Déficit de l’État',
    avant: `4,3${NB}%`,
    apres: `2,5${NB}%`,
    verdict: 'Il se réduit',
    precision: `en part du PIB, dons${NB}compris`,
  },
  {
    libelle: 'Taux de couverture',
    avant: `58,5${NB}%`,
    apres: `81,5${NB}%`,
    verdict: 'Il s’améliore',
    precision: `exportations rapportées aux${NB}importations`,
  },
];

/** Pourcentage écrit à la française : 47,4 % (virgule, espace insécable). */
export function pourcentFr(valeur: number): string {
  return `${valeur.toFixed(1).replace('.', ',')}${NB}%`;
}

export { secteurFr } from '@/lib/typographie-fr';

/** Ville du siège : « Arlit, Niger » devient « Arlit ». */
export function villeDuSiege(siege: string | null | undefined): string {
  return (siege ?? '').split(',')[0]!.trim();
}

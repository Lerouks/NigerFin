import {
  AsYouType,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from 'libphonenumber-js';
import { TOUS_LES_PAYS } from '@/lib/pays';

/**
 * Le téléphone d'un lecteur, facultatif et imprimé seulement sur ses factures.
 * La bibliothèque de Google (libphonenumber) connaît la longueur des numéros
 * de chaque pays : elle remplace l'ancienne liste écrite à la main, fausse pour
 * le Bénin (10 chiffres depuis le 30/11/2024). Le numéro s'enregistre au format
 * international E.164, « +22790123456 ».
 */

export const PAYS_PAR_DEFAUT: CountryCode = 'NE';

const INSECABLE = ' ';

export function estPaysDuTelephone(iso: string): iso is CountryCode {
  return TOUS_LES_PAYS.some((p) => p.iso === iso);
}

/** « +227 » pour le Niger. */
export function indicatif(iso: CountryCode): string {
  return `+${getCountryCallingCode(iso)}`;
}

/** Le numéro au format international, ou null s'il n'est pas valable. */
export function telephoneE164(valeur: string, pays?: CountryCode): string | null {
  const numero = parsePhoneNumberFromString(valeur.trim(), pays);
  return numero && numero.isValid() ? numero.number : null;
}

/** La phrase d'erreur d'un numéro saisi, ou null s'il est vide ou valable. */
export function erreurTelephone(valeur: string | null | undefined): string | null {
  if (!valeur || !valeur.trim()) return null;
  const numero = parsePhoneNumberFromString(valeur.trim());
  if (numero && numero.isValid()) return null;
  return 'Ce numéro de téléphone n’est pas valable. Vérifiez l’indicatif et le nombre de chiffres.';
}

/** Le pays et la partie nationale d'un numéro enregistré, pour le formulaire. */
export function decomposerTelephone(valeur: string | null | undefined): { pays: CountryCode; national: string } {
  if (!valeur) return { pays: PAYS_PAR_DEFAUT, national: '' };
  const numero = parsePhoneNumberFromString(valeur);
  if (numero?.country && estPaysDuTelephone(numero.country)) {
    return { pays: numero.country, national: numero.nationalNumber };
  }
  return { pays: PAYS_PAR_DEFAUT, national: valeur.replace(/\D/g, '') };
}

/** La saisie en cours, regroupée comme on l'écrit dans le pays (« 90 12 34 56 »). */
export function saisieLisible(chiffres: string, pays: CountryCode): string {
  if (!chiffres) return '';
  return new AsYouType(pays).input(chiffres);
}

/** « +227 90 12 34 56 », les groupes soudés par des espaces insécables. */
export function telephoneLisible(valeur: string): string {
  const numero = parsePhoneNumberFromString(valeur.replace(/\s+/g, ''));
  if (!numero || !numero.isValid()) return valeur;
  return numero.formatInternational().replace(/ /g, INSECABLE);
}

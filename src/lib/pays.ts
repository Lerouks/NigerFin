/**
 * Les pays proposés dans les formulaires, l'Afrique de l'Ouest en tête : le
 * Niger, le Mali, le Burkina Faso et la Côte d'Ivoire d'abord, puis le reste
 * de la région, puis les autres pays (décision de Raouf, 26/11/2026). Le même
 * ordre sert au pays de l'adresse et à l'indicatif du téléphone.
 */

export interface Pays {
  nom: string;
  /** Code ISO 3166-1 alpha-2, celui de la bibliothèque des numéros de téléphone. */
  iso: string;
}

export const PAYS_EN_TETE: readonly Pays[] = [
  { nom: 'Niger', iso: 'NE' },
  { nom: 'Mali', iso: 'ML' },
  { nom: 'Burkina Faso', iso: 'BF' },
  { nom: 'Côte d’Ivoire', iso: 'CI' },
];

export const AUTRES_PAYS_AFRIQUE_OUEST: readonly Pays[] = [
  { nom: 'Bénin', iso: 'BJ' },
  { nom: 'Cap-Vert', iso: 'CV' },
  { nom: 'Gambie', iso: 'GM' },
  { nom: 'Ghana', iso: 'GH' },
  { nom: 'Guinée', iso: 'GN' },
  { nom: 'Guinée-Bissau', iso: 'GW' },
  { nom: 'Liberia', iso: 'LR' },
  { nom: 'Mauritanie', iso: 'MR' },
  { nom: 'Nigeria', iso: 'NG' },
  { nom: 'Sénégal', iso: 'SN' },
  { nom: 'Sierra Leone', iso: 'SL' },
  { nom: 'Togo', iso: 'TG' },
];

export const AUTRES_PAYS: readonly Pays[] = [
  { nom: 'Algérie', iso: 'DZ' },
  { nom: 'Allemagne', iso: 'DE' },
  { nom: 'Arabie saoudite', iso: 'SA' },
  { nom: 'Belgique', iso: 'BE' },
  { nom: 'Cameroun', iso: 'CM' },
  { nom: 'Canada', iso: 'CA' },
  { nom: 'Centrafrique', iso: 'CF' },
  { nom: 'Chine', iso: 'CN' },
  { nom: 'Comores', iso: 'KM' },
  { nom: 'Congo', iso: 'CG' },
  { nom: 'Djibouti', iso: 'DJ' },
  { nom: 'Égypte', iso: 'EG' },
  { nom: 'Émirats arabes unis', iso: 'AE' },
  { nom: 'États-Unis', iso: 'US' },
  { nom: 'Éthiopie', iso: 'ET' },
  { nom: 'France', iso: 'FR' },
  { nom: 'Gabon', iso: 'GA' },
  { nom: 'Inde', iso: 'IN' },
  { nom: 'Kenya', iso: 'KE' },
  { nom: 'Madagascar', iso: 'MG' },
  { nom: 'Maroc', iso: 'MA' },
  { nom: 'RD Congo', iso: 'CD' },
  { nom: 'Royaume-Uni', iso: 'GB' },
  { nom: 'Rwanda', iso: 'RW' },
  { nom: 'Suisse', iso: 'CH' },
  { nom: 'Tchad', iso: 'TD' },
  { nom: 'Tunisie', iso: 'TN' },
];

/** La région en entier, dans l'ordre affiché. */
export const PAYS_AFRIQUE_OUEST: readonly Pays[] = [...PAYS_EN_TETE, ...AUTRES_PAYS_AFRIQUE_OUEST];

/** Tous les pays nommés, dans l'ordre affiché. */
export const TOUS_LES_PAYS: readonly Pays[] = [...PAYS_AFRIQUE_OUEST, ...AUTRES_PAYS];

/** Le choix « Autre » de la liste des pays de l'adresse. */
export const PAYS_AUTRE = 'Autre';

/**
 * Le nom d'un pays de la liste, l'apostrophe droite des anciennes saisies
 * redressée (« Côte d'Ivoire ») ; une valeur hors liste reste telle quelle.
 */
export function nomDePays(valeur: string | null | undefined): string {
  if (!valeur) return '';
  const redresse = valeur.replace(/'/g, '’');
  return TOUS_LES_PAYS.find((p) => p.nom === redresse)?.nom ?? valeur;
}

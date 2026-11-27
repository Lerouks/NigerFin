/**
 * Les règles de l'identité d'un lecteur, les mêmes dans le navigateur et sur le
 * serveur (décisions de Raouf, 26 et 27/11/2026) :
 * - la civilité, M. ou Mme, est obligatoire : elle sert à compter les femmes et
 *   les hommes qui nous lisent ;
 * - le prénom et le nom sont obligatoires, de 2 à 50 caractères chacun ;
 * - ils s'écrivent en lettres latines avec leurs accents, haoussa et peul
 *   compris (ɓ, ɗ, ƙ, ƴ), séparées par une espace, un tiret ou une apostrophe
 *   (la droite ' comme la typographique ’, que l'iPhone tape tout seul) ; ni
 *   point, ni chiffre, ni symbole, ni autre alphabet ;
 * - la profession et la tranche d'âge sont facultatives. Les tranches sont
 *   celles de Meta, pour comparer le public du site à celui de nos pages
 *   Facebook et Instagram.
 */

export const CIVILITES = ['M.', 'Mme'] as const;
export type Civilite = (typeof CIVILITES)[number];

export function estCivilite(valeur: unknown): valeur is Civilite {
  return valeur === 'M.' || valeur === 'Mme';
}

export const NOM_MIN = 2;
export const NOM_MAX = 50;

/** Un mot : une lettre latine, puis des lettres latines ou des accents combinés. */
const MOT = '\\p{Script=Latin}[\\p{Script=Latin}\\p{M}]*';
/** Des mots séparés par une seule espace, un tiret ou une apostrophe. */
const NOM_PERMIS = new RegExp(`^${MOT}(?:[ '’-]${MOT})*$`, 'u');

/** Le nom tel qu'on l'enregistre : accents composés, espaces simples, rien autour. */
export function normaliserNom(valeur: string): string {
  return valeur.normalize('NFC').replace(/\s+/gu, ' ').trim();
}

/** La première règle que le prénom ou le nom ne tient pas, en une phrase, ou null. */
export function erreurNom(valeur: string, etiquette: 'Le prénom' | 'Le nom'): string | null {
  const nom = normaliserNom(valeur);
  if (!nom) return `${etiquette} est obligatoire.`;
  const longueur = [...nom].length;
  if (longueur < NOM_MIN) return `${etiquette} doit contenir au moins ${NOM_MIN} lettres.`;
  if (longueur > NOM_MAX) return `${etiquette} ne doit pas dépasser ${NOM_MAX} caractères.`;
  if (!NOM_PERMIS.test(nom)) {
    return `${etiquette} ne peut contenir que des lettres, des espaces, des tirets et des apostrophes.`;
  }
  return null;
}

export const TRANCHES_AGE = [
  { valeur: 'moins-18', libelle: 'Moins de 18 ans' },
  { valeur: '18-24', libelle: '18 à 24 ans' },
  { valeur: '25-34', libelle: '25 à 34 ans' },
  { valeur: '35-44', libelle: '35 à 44 ans' },
  { valeur: '45-54', libelle: '45 à 54 ans' },
  { valeur: '55-64', libelle: '55 à 64 ans' },
  { valeur: '65-plus', libelle: '65 ans et plus' },
] as const;

export type TrancheAge = (typeof TRANCHES_AGE)[number]['valeur'];

export function estTrancheAge(valeur: unknown): valeur is TrancheAge {
  return TRANCHES_AGE.some((t) => t.valeur === valeur);
}

export function libelleTrancheAge(valeur: string | null | undefined): string | null {
  return TRANCHES_AGE.find((t) => t.valeur === valeur)?.libelle ?? null;
}

export const PROFESSIONS = [
  'Entrepreneur', 'Fonctionnaire', 'Cadre d’entreprise', 'Commerçant', 'Agriculteur',
  'Enseignant / Chercheur', 'Étudiant', 'Journaliste / Média', 'Banquier / Finance',
  'Ingénieur / Technicien', 'Médecin / Santé', 'Avocat / Juriste', 'Consultant',
  'Artisan', 'Retraité', 'Sans emploi', 'Autre',
] as const;

/** Une profession de la liste, l'apostrophe droite des anciennes saisies redressée ; sinon null. */
export function professionConnue(valeur: string | null | undefined): string | null {
  if (!valeur) return null;
  const redressee = valeur.replace(/'/g, '’');
  return (PROFESSIONS as readonly string[]).includes(redressee) ? redressee : null;
}

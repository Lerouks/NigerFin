import { nombreFr } from '@/lib/typographie-fr';

/**
 * Noms lisibles de la corbeille. Aucune dépendance serveur : l'écran
 * d'administration les importe tels quels.
 */

/** Tables de contenu dont la suppression passe par la corbeille. */
export type TableCorbeille =
  | 'articles'
  | 'education_lessons'
  | 'education_categories'
  | 'strategic_enterprises'
  | 'legal_sections'
  | 'newsletter_issues';

export const TABLES_CORBEILLE: readonly TableCorbeille[] = [
  'articles',
  'education_lessons',
  'education_categories',
  'strategic_enterprises',
  'legal_sections',
  'newsletter_issues',
];

export function estTableCorbeille(valeur: unknown): valeur is TableCorbeille {
  return typeof valeur === 'string' && (TABLES_CORBEILLE as readonly string[]).includes(valeur);
}

/**
 * Durée de conservation : une entrée plus ancienne est supprimée pour de bon,
 * chaque nuit et à chaque ouverture de la corbeille. La base refuse toute
 * purge en dessous de trente jours (corbeille_purger, migration 00032).
 */
export const DUREE_CONSERVATION_JOURS = 30;

/** Le moment où une entrée quittera la corbeille pour de bon. */
export function finDeConservation(supprimeLe: string): Date | null {
  const date = new Date(supprimeLe);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getTime() + DUREE_CONSERVATION_JOURS * 24 * 60 * 60 * 1000);
}

export const LIBELLE_CONTENU: Record<TableCorbeille, string> = {
  articles: 'Article',
  education_lessons: 'Leçon',
  education_categories: 'Catégorie de leçons',
  strategic_enterprises: 'Fiche entreprise',
  legal_sections: 'Section de page légale',
  newsletter_issues: 'Numéro de newsletter',
};

export interface Libelle {
  un: string;
  plusieurs: string;
}

/**
 * Ce que la base efface avec un contenu, et donc ce que la corbeille garde,
 * dans l'ordre où l'écran le cite. Les commentaires et j'aime d'un article
 * n'y figurent pas : en production, ils survivent à l'article.
 */
export type TableDependante = 'education_lessons' | 'learning_path_steps' | 'user_lesson_progress' | 'newsletter_events';

export const LIBELLE_DEPENDANT: Record<TableDependante, Libelle> = {
  education_lessons: { un: 'leçon', plusieurs: 'leçons' },
  learning_path_steps: { un: 'étape de parcours', plusieurs: 'étapes de parcours' },
  user_lesson_progress: { un: 'progression de lecteur', plusieurs: 'progressions de lecteurs' },
  newsletter_events: { un: 'événement d’envoi', plusieurs: 'événements d’envoi' },
};

const ORDRE_DEPENDANTS: readonly string[] = Object.keys(LIBELLE_DEPENDANT);
const LIGNE_LIEE: Libelle = { un: 'ligne liée', plusieurs: 'lignes liées' };

const PLURIEL_CONTENU: Record<TableCorbeille, string> = {
  articles: 'articles',
  education_lessons: 'leçons',
  education_categories: 'catégories de leçons',
  strategic_enterprises: 'fiches entreprises',
  legal_sections: 'sections des pages légales',
  newsletter_issues: 'numéros de newsletter',
};

/** Une table de la base, pour une phrase : « la table des progressions de lecteurs ». */
export function nomDeTable(table: unknown): string {
  if (estTableCorbeille(table)) return `la table des ${PLURIEL_CONTENU[table]}`;
  const dependant = typeof table === 'string' ? (LIBELLE_DEPENDANT as Record<string, Libelle | undefined>)[table] : undefined;
  return dependant ? `la table des ${dependant.plusieurs}` : 'une table de la base';
}

function libelleDe(table: string): Libelle {
  return (LIBELLE_DEPENDANT as Record<string, Libelle | undefined>)[table] ?? LIGNE_LIEE;
}

/** « 1 leçon », « 1 450 progressions » : le nombre, à la française, reste collé à son nom. */
export function compter(nombre: number, libelle: Libelle): string {
  return `${nombreFr(nombre)}\u00a0${nombre > 1 ? libelle.plusieurs : libelle.un}`;
}

/** « a, b et c ». */
export function listeFr(morceaux: readonly string[]): string {
  if (morceaux.length <= 1) return morceaux[0] ?? '';
  return `${morceaux.slice(0, -1).join(', ')} et ${morceaux[morceaux.length - 1]}`;
}

/** « 3 leçons et 12 progressions de lecteurs », ou null quand rien n'a été gardé avec le contenu. */
export function resumerDependants(resume: Record<string, unknown> | null | undefined): string | null {
  const entrees = Object.entries(resume ?? {}).filter(
    (entree): entree is [string, number] => typeof entree[1] === 'number' && entree[1] > 0,
  );
  // La base range les clés de son jsonb à sa façon : l'ordre de lecture est fixé ici.
  entrees.sort(([a], [b]) => rang(a) - rang(b));
  const morceaux = entrees.map(([table, nombre]) => compter(nombre, libelleDe(table)));
  return morceaux.length > 0 ? listeFr(morceaux) : null;
}

function rang(table: string): number {
  const position = ORDRE_DEPENDANTS.indexOf(table);
  return position === -1 ? ORDRE_DEPENDANTS.length : position;
}

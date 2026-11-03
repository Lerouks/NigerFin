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
 * Durée de conservation, en jours de Niamey. Une entrée reste récupérable
 * jusqu'au soir du jour de sa mise à la corbeille plus trente jours
 * (dernierJourRecuperable), puis elle est supprimée pour de bon, par la tâche
 * de nuit ou à l'ouverture de la corbeille. La base refuse toute purge en
 * dessous de trente jours (corbeille_purger, migration 00032).
 */
export const DUREE_CONSERVATION_JOURS = 30;

/**
 * Le fuseau où la corbeille compte ses jours : celui de Niamey (UTC+1 toute
 * l'année), comme corbeille_limite_purge dans la base. L'écran affiche ses
 * dates dans ce fuseau, quel que soit celui du navigateur : sinon la date
 * affichée et celle de la purge pourraient différer d'un jour.
 */
export const FUSEAU_CORBEILLE = 'Africa/Niamey';

const JOUR_A_NIAMEY = new Intl.DateTimeFormat('fr-FR', {
  timeZone: FUSEAU_CORBEILLE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Un jour de calendrier, « 2026-12-03 », à partir de ses trois nombres (Date.UTC reporte les mois et les années). */
function jourIso(annee: number, mois: number, jour: number): string {
  return new Date(Date.UTC(annee, mois - 1, jour)).toISOString().slice(0, 10);
}

/** Le jour qu'il est à Niamey à cet instant, « 2026-11-03 ». Null pour une date illisible. */
export function jourANiamey(instant: string | Date): string | null {
  const date = instant instanceof Date ? instant : new Date(instant);
  if (Number.isNaN(date.getTime())) return null;
  const parties = JOUR_A_NIAMEY.formatToParts(date);
  const valeur = (type: 'year' | 'month' | 'day') => Number(parties.find((partie) => partie.type === type)?.value);
  return jourIso(valeur('year'), valeur('month'), valeur('day'));
}

/**
 * Le dernier jour où une entrée est récupérable, « 2026-12-03 » : le jour de
 * sa mise à la corbeille, à Niamey, plus trente jours. Elle reste dans la
 * corbeille jusqu'à la fin de ce jour, heure de Niamey : la purge
 * (corbeille_limite_purge, migration 00032) ne la supprime qu'à partir du
 * lendemain, à minuit. Une entrée mise à la corbeille le 3 novembre à 1 h 30
 * est donc encore là le 3 décembre après la tâche de 3 h.
 */
export function dernierJourRecuperable(supprimeLe: string): string | null {
  const jour = jourANiamey(supprimeLe);
  if (!jour) return null;
  const [annee = 0, mois = 1, quantieme = 1] = jour.split('-').map(Number);
  return jourIso(annee, mois, quantieme + DUREE_CONSERVATION_JOURS);
}

/** « 3 décembre 2026 », pour le jour de calendrier « 2026-12-03 ». */
export function jourEnLettres(jour: string): string {
  const [annee = 0, mois = 1, quantieme = 1] = jour.split('-').map(Number);
  return new Date(Date.UTC(annee, mois - 1, quantieme)).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
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
 * n'y figurent pas : ils restent en place tant qu'il est dans la corbeille,
 * et sont supprimés avec lui quand il la quitte pour de bon.
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

import type { Article } from '@/types';

/**
 * Tri et filtres des listes d'articles des rubriques (Économie, Finance, Tous
 * les articles, Marchés).
 *
 * Décision du 25/11/2026 : la barre ne propose QUE les choix qui changent
 * vraiment la liste. Une rubrique de six articles gratuits, tous de moins de
 * cinq minutes, n'affichait pas moins de trois choix menant à une page vide
 * (« Premium », « 5 à 10 min », « Plus de 10 min ») et deux qui ne changeaient
 * rien. Les choix reviennent d'eux-mêmes quand les articles arrivent.
 */

export type Acces = 'tous' | 'gratuits' | 'premium';
export type Tri = 'recents' | 'anciens' | 'lus';
export type Duree = 'toutes' | 'courts' | 'moyens' | 'longs';

export interface ChoixArticles {
  /** Clé de section de la facette choisie (ex. « marches »), `null` pour tous les sujets. */
  theme: string | null;
  acces: Acces;
  tri: Tri;
  duree: Duree;
}

export const CHOIX_PAR_DEFAUT: ChoixArticles = { theme: null, acces: 'tous', tri: 'recents', duree: 'toutes' };

export interface OptionChoix<T> {
  valeur: T;
  libelle: string;
}

/** Facette thématique d'une rubrique : une clé de `article.sections` et son libellé. */
export interface Facette {
  key: string;
  label: string;
}

const NBSP = '\u00a0';

export const OPTIONS_TRI: OptionChoix<Tri>[] = [
  { valeur: 'recents', libelle: 'Plus récents' },
  { valeur: 'anciens', libelle: 'Plus anciens' },
  { valeur: 'lus', libelle: 'Les plus lus' },
];

export const OPTIONS_ACCES: OptionChoix<Acces>[] = [
  { valeur: 'tous', libelle: 'Tous' },
  { valeur: 'gratuits', libelle: 'Gratuits' },
  { valeur: 'premium', libelle: 'Premium' },
];

export const OPTIONS_DUREE: OptionChoix<Duree>[] = [
  { valeur: 'toutes', libelle: 'Toutes durées' },
  { valeur: 'courts', libelle: `Moins de 5${NBSP}min` },
  { valeur: 'moyens', libelle: `5${NBSP}à${NBSP}10${NBSP}min` },
  { valeur: 'longs', libelle: `Plus de 10${NBSP}min` },
];

export const TOUS_LES_SUJETS = 'Tous les sujets';

/** Tranche de durée de lecture d'un article. */
export function trancheDeDuree(minutes: number): Exclude<Duree, 'toutes'> {
  if (minutes < 5) return 'courts';
  if (minutes <= 10) return 'moyens';
  return 'longs';
}

/** La liste filtrée puis triée. `viewRanking` : identifiants du plus lu au moins lu. */
export function filtrerArticles(articles: Article[], choix: ChoixArticles, viewRanking: string[] = []): Article[] {
  let liste = [...articles];
  if (choix.theme) {
    const theme = choix.theme;
    liste = liste.filter((a) => a.sections?.includes(theme));
  }
  if (choix.acces === 'gratuits') liste = liste.filter((a) => !a.isPremium);
  if (choix.acces === 'premium') liste = liste.filter((a) => a.isPremium);
  if (choix.duree !== 'toutes') liste = liste.filter((a) => trancheDeDuree(a.readTime) === choix.duree);

  if (choix.tri === 'lus' && viewRanking.length > 0) {
    const rang = new Map(viewRanking.map((id, i) => [id, i]));
    liste.sort((a, b) => (rang.get(a._id) ?? Infinity) - (rang.get(b._id) ?? Infinity));
  } else {
    liste.sort((a, b) => {
      const da = new Date(a.publishedAt).getTime();
      const db = new Date(b.publishedAt).getTime();
      return choix.tri === 'anciens' ? da - db : db - da;
    });
  }
  return liste;
}

export interface ChoixProposes {
  /** Vide quand le groupe ne changerait rien : il n'est alors pas affiché. */
  themes: OptionChoix<string | null>[];
  acces: OptionChoix<Acces>[];
  durees: OptionChoix<Duree>[];
  tris: OptionChoix<Tri>[];
}

/** Les groupes et les choix qui changent vraiment la liste de cette rubrique. */
export function choixProposes(articles: Article[], facettes: Facette[], viewRanking: string[] = []): ChoixProposes {
  const total = articles.length;

  // Thème : une facette qui regroupe au moins un article, sans les regrouper tous.
  const facettesUtiles = facettes.filter((f) => {
    const n = articles.filter((a) => a.sections?.includes(f.key)).length;
    return n > 0 && n < total;
  });
  const themes: OptionChoix<string | null>[] =
    facettesUtiles.length > 0
      ? [{ valeur: null, libelle: TOUS_LES_SUJETS }, ...facettesUtiles.map((f) => ({ valeur: f.key, libelle: f.label }))]
      : [];

  // Type : seulement quand la rubrique a des articles gratuits ET Premium.
  const premium = articles.filter((a) => a.isPremium).length;
  const acces = premium > 0 && premium < total ? OPTIONS_ACCES : [];

  // Durée : seulement quand les articles tombent dans au moins deux tranches,
  // et seulement les tranches qui ont des articles.
  const tranches = new Set(articles.map((a) => trancheDeDuree(a.readTime)));
  const durees =
    tranches.size >= 2
      ? OPTIONS_DUREE.filter((o) => o.valeur === 'toutes' || tranches.has(o.valeur as Exclude<Duree, 'toutes'>))
      : [];

  // Tri : utile dès deux articles ; « Les plus lus » seulement quand des
  // lectures sont comptées pour des articles de la rubrique.
  const lectures = viewRanking.some((id) => articles.some((a) => a._id === id));
  const tris = total >= 2 ? OPTIONS_TRI.filter((o) => o.valeur !== 'lus' || lectures) : [];

  return { themes, acces, durees, tris };
}

/** Nombre de choix qui s'écartent du réglage de départ. */
export function nombreDeChoixActifs(choix: ChoixArticles): number {
  return [
    choix.theme !== null,
    choix.acces !== CHOIX_PAR_DEFAUT.acces,
    choix.tri !== CHOIX_PAR_DEFAUT.tri,
    choix.duree !== CHOIX_PAR_DEFAUT.duree,
  ].filter(Boolean).length;
}

function libelleDe<T>(options: OptionChoix<T>[], valeur: T): string | null {
  return options.find((o) => o.valeur === valeur)?.libelle ?? null;
}

/**
 * Ce qui est appliqué, morceau par morceau : ["Gratuits", "les plus lus"].
 * Premier mot en capitale, les suivants en minuscule, sauf « Premium ».
 */
export function morceauxDuResume(choix: ChoixArticles, facettes: Facette[]): string[] {
  const morceaux = [
    choix.theme ? facettes.find((f) => f.key === choix.theme)?.label ?? null : null,
    choix.acces !== 'tous' ? libelleDe(OPTIONS_ACCES, choix.acces) : null,
    choix.duree !== 'toutes' ? libelleDe(OPTIONS_DUREE, choix.duree) : null,
    choix.tri !== 'recents' ? libelleDe(OPTIONS_TRI, choix.tri) : null,
  ].filter((m): m is string => Boolean(m));
  return morceaux.map((m, i) => (i === 0 || m === 'Premium' ? m : m.charAt(0).toLowerCase() + m.slice(1)));
}

/** Ce qui est appliqué, en une ligne : « Gratuits, les plus lus ». */
export function resumeDesChoix(choix: ChoixArticles, facettes: Facette[]): string {
  return morceauxDuResume(choix, facettes).join(', ');
}

/** « 6 articles », « 1 article », « 2 articles sur 6 » (seulement quand la liste est réduite), « Aucun article ». */
export function libelleNombre(n: number, total: number): string {
  if (n === 0) return 'Aucun article';
  const mot = n > 1 ? 'articles' : 'article';
  return n < total ? `${n}${NBSP}${mot} sur ${total}` : `${n}${NBSP}${mot}`;
}

/** Texte du bouton qui ferme le panneau et montre la liste. */
export function libelleAfficher(n: number): string {
  if (n === 0) return 'Aucun article';
  if (n === 1) return 'Afficher l’article';
  return `Afficher les ${n}${NBSP}articles`;
}

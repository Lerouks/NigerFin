import { revalidatePath, revalidateTag } from 'next/cache';
import { ARTICLE_CACHE_TAG } from '@/lib/articles';
import { STRATEGIC_ENTERPRISES_CACHE_TAG } from '@/lib/strategic-enterprises';

/**
 * Ce que chaque type de contenu rafraîchit sur le site public quand il change.
 *
 * Un seul endroit pour la suppression ET la restauration : un contenu remis en
 * place doit réapparaître exactement là d'où sa suppression l'avait retiré.
 * Avant, la corbeille rafraîchissait sa propre liste de pages, différente de
 * celle de la suppression : un article restauré restait invisible sur sa page
 * jusqu'à l'expiration du cache, une heure plus tard.
 */

const RUBRIQUES_ARTICLES = ['/economie', '/finance', '/entreprises', '/education', '/marches', '/niger'] as const;

export const PAGES_LEGALES = [
  '/mentions-legales',
  '/confidentialite',
  '/cgu',
  '/cookies',
  '/about',
  '/publicite',
  '/contact',
] as const;

/** Toutes les pages qui affichent des articles, et la page de l'article lui-même. */
export function revaliderArticles(slug?: string | null): void {
  // Purge le Data Cache Next.js (unstable_cache des fonctions articles).
  // Sans ça, les pages re-rendues serviraient encore l'ancien snapshot data.
  // Next.js 16 : second argument obligatoire, { expire: 0 } = purge immédiate.
  revalidateTag(ARTICLE_CACHE_TAG, { expire: 0 });
  revalidatePath('/');
  if (slug) revalidatePath(`/articles/${slug}`);
  for (const rubrique of RUBRIQUES_ARTICLES) {
    revalidatePath(rubrique);
  }
  revalidatePath('/articles');
}

/** L'atlas des entreprises et la fiche elle-même. */
export function revaliderEntreprises(slug?: string | null): void {
  revalidateTag(STRATEGIC_ENTERPRISES_CACHE_TAG, 'max');
  revalidatePath('/entreprises');
  if (slug) revalidatePath(`/entreprises/${slug}`);
}

/** Les pages légales, qui lisent toutes la même table de sections. */
export function revaliderPagesLegales(): void {
  for (const page of PAGES_LEGALES) {
    revalidatePath(page);
  }
}

/**
 * L'accueil Éducation, chaque page de catégorie (elle liste ses leçons) et
 * chaque parcours (il enchaîne des leçons). Rafraîchir le seul /education
 * laissait une leçon supprimée, ou restaurée, en l'état pendant une heure sur
 * sa page de catégorie.
 */
export function revaliderEducation(): void {
  revalidatePath('/education');
  revalidatePath('/education/[id]', 'page');
  revalidatePath('/education/parcours/[slug]', 'page');
}

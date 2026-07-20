import { NAVIGATION, getNavigationEntry } from '@/lib/navigation';

/**
 * Metadonnees des sections, DERIVEES de la source unique `navigation.ts`.
 * Ne plus recopier de rubrique a la main ici : ajouter l'entree dans NAVIGATION.
 *
 * Sert notamment aux badges de section sur les articles et aux liens de tag.
 */
export const SECTION_META: Record<string, { label: string; path: string }> =
  Object.fromEntries(
    NAVIGATION.map((entry) => [entry.key, { label: entry.label, path: entry.path }]),
  );

/**
 * La cle « marches » est CONSERVEE mais son lien pointe desormais vers /finance.
 *
 * Marches sort de la barre de navigation et ses articles remontent dans Finance,
 * en facette « Marches & BRVM ». Retirer la cle aurait casse tous les liens de
 * tag des articles deja publies, qui portent encore la section « marches ». La
 * page /marches, elle, reste accessible en 200 et n'est jamais redirigee : seul
 * le lien de TAG change de destination, pas la page.
 */
SECTION_META.marches = {
  label: 'Marchés',
  path: getNavigationEntry('finance')!.path,
};

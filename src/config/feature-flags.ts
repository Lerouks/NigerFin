/**
 * Registre central des feature flags PostHog.
 *
 * Pour ajouter un flag :
 * 1. Ajouter une entrée ici (clé en SCREAMING_SNAKE_CASE, valeur en kebab-case).
 * 2. Créer le flag dans PostHog (Settings > Feature Flags) avec le même nom kebab-case.
 * 3. L'utiliser via `useFeatureFlag(FEATURE_FLAGS.MON_FLAG)` (client) ou
 *    `isFeatureEnabled(FEATURE_FLAGS.MON_FLAG, user)` (serveur).
 *
 * Ce registre rend les noms de flags type-safe : impossible de typo un nom
 * sans erreur TypeScript.
 */
export const FEATURE_FLAGS = {
  /** Variante du hero de la home pour A/B test (control / variant-a / variant-b). */
  HOME_HERO_VARIANT: 'home-hero-variant',
  /** Popup newsletter agressif (affichage scroll 50%) vs subtil (footer only). */
  NEWSLETTER_POPUP_AGGRESSIVE: 'newsletter-popup-aggressive',
  /** Bannière promotion Premium (offre limitée, freemium nudge). */
  PREMIUM_PROMO_BANNER: 'premium-promo-banner',
  /** Nouvelle UI paywall (cartes Premium vs liste classique). */
  PAYWALL_CARDS_LAYOUT: 'paywall-cards-layout',
  /** Active la recherche avancée full-text (béta). */
  ADVANCED_SEARCH_BETA: 'advanced-search-beta',
} as const;

export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;
export type FeatureFlagName = (typeof FEATURE_FLAGS)[FeatureFlagKey];

/**
 * Valeurs par défaut quand PostHog n'a pas encore chargé les flags ou est désactivé.
 * Garde le comportement sûr/stable par défaut.
 */
export const FEATURE_FLAG_DEFAULTS: Record<FeatureFlagName, boolean | string> = {
  [FEATURE_FLAGS.HOME_HERO_VARIANT]: 'control',
  [FEATURE_FLAGS.NEWSLETTER_POPUP_AGGRESSIVE]: false,
  [FEATURE_FLAGS.PREMIUM_PROMO_BANNER]: false,
  [FEATURE_FLAGS.PAYWALL_CARDS_LAYOUT]: false,
  [FEATURE_FLAGS.ADVANCED_SEARCH_BETA]: false,
};

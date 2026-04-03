/**
 * Centralized Financial Data Layer — Asset Configuration
 *
 * RULE 5: To add a new asset, add an entry here. No other code changes needed.
 * The validation, caching, and fallback logic applies automatically.
 */

import type { AssetConfig } from './types';

/**
 * All financial assets tracked by the site.
 *
 * Provider order matters: first provider is primary, rest are fallbacks.
 * For futures: tickers MUST point to the front-month contract (RULE 3).
 */
export const ASSET_CONFIGS: AssetConfig[] = [
  // ── Currencies ──────────────────────────────────────────────
  {
    symbol: 'EUR/XOF',
    name: 'EUR/XOF',
    type: 'currency',
    unit: 'XOF',
    currency: 'XOF',
    maxStalenessHours: 48, // Fixed rate, rarely changes
    providers: [{ name: 'frankfurter', ticker: 'EUR' }],
    description:
      "Taux de change fixe entre l'euro et le franc CFA (UEMOA), garanti par la France. Référence incontournable pour le commerce extérieur de la zone UEMOA.",
    educationLink: '/education/devises-change',
  },
  {
    symbol: 'USD/XOF',
    name: 'USD/XOF',
    type: 'currency',
    unit: 'XOF',
    currency: 'XOF',
    maxStalenessHours: 48,
    providers: [{ name: 'frankfurter', ticker: 'USD' }],
    description:
      "Taux de change du dollar américain contre le franc CFA. Varie en fonction du cours EUR/USD car le XOF est arrimé à l'euro.",
    educationLink: '/education/devises-change',
  },
  {
    symbol: 'GBP/XOF',
    name: 'GBP/XOF',
    type: 'currency',
    unit: 'XOF',
    currency: 'XOF',
    maxStalenessHours: 48,
    providers: [{ name: 'frankfurter', ticker: 'GBP' }],
  },
  {
    symbol: 'CHF/XOF',
    name: 'CHF/XOF',
    type: 'currency',
    unit: 'XOF',
    currency: 'XOF',
    maxStalenessHours: 48,
    providers: [{ name: 'frankfurter', ticker: 'CHF' }],
  },
  {
    symbol: 'JPY/XOF',
    name: 'JPY/XOF',
    type: 'currency',
    unit: 'XOF',
    currency: 'XOF',
    maxStalenessHours: 48,
    providers: [{ name: 'frankfurter', ticker: 'JPY' }],
  },
  {
    symbol: 'CAD/XOF',
    name: 'CAD/XOF',
    type: 'currency',
    unit: 'XOF',
    currency: 'XOF',
    maxStalenessHours: 48,
    providers: [{ name: 'frankfurter', ticker: 'CAD' }],
  },
  {
    symbol: 'CNY/XOF',
    name: 'CNY/XOF',
    type: 'currency',
    unit: 'XOF',
    currency: 'XOF',
    maxStalenessHours: 48,
    providers: [{ name: 'frankfurter', ticker: 'CNY' }],
  },
  {
    symbol: 'NGN/XOF',
    name: 'NGN/XOF',
    type: 'currency',
    unit: 'XOF',
    currency: 'XOF',
    maxStalenessHours: 48,
    providers: [{ name: 'frankfurter', ticker: 'NGN' }],
  },
  {
    symbol: 'GHS/XOF',
    name: 'GHS/XOF',
    type: 'currency',
    unit: 'XOF',
    currency: 'XOF',
    maxStalenessHours: 48,
    providers: [{ name: 'frankfurter', ticker: 'GHS' }],
  },
  {
    symbol: 'MAD/XOF',
    name: 'MAD/XOF',
    type: 'currency',
    unit: 'XOF',
    currency: 'XOF',
    maxStalenessHours: 48,
    providers: [{ name: 'frankfurter', ticker: 'MAD' }],
  },
  {
    symbol: 'ZAR/XOF',
    name: 'ZAR/XOF',
    type: 'currency',
    unit: 'XOF',
    currency: 'XOF',
    maxStalenessHours: 48,
    providers: [{ name: 'frankfurter', ticker: 'ZAR' }],
  },

  // ── Commodities ─────────────────────────────────────────────
  // RULE 3: Front-month obligatoire — BZ=F is ICE Brent continuous front-month
  {
    symbol: 'ICEEUR:BRN1!',
    name: 'Pétrole brut Brent',
    type: 'commodity',
    unit: 'USD/baril',
    currency: 'USD',
    maxStalenessHours: 24,
    providers: [
      { name: 'yahoo', ticker: 'BZ=F' },
      { name: 'trading-economics', ticker: 'brent' },
    ],
    description:
      "Contrat futures Brent front-month (ICE Europe). Référence mondiale du prix du pétrole brut. Impacte directement le coût de l'énergie et des transports au Niger et dans la sous-région.",
    educationLink: '/education/matieres-premieres',
  },
  {
    symbol: 'XAU',
    name: 'Or (once)',
    type: 'commodity',
    unit: 'USD/once',
    currency: 'USD',
    maxStalenessHours: 24,
    providers: [
      { name: 'yahoo', ticker: 'GC=F' },
      { name: 'frankfurter-gold', ticker: 'XAU' },
    ],
    description:
      "Cours de l'once d'or (31,1 g) sur les marchés internationaux. Valeur refuge par excellence, l'or est aussi une ressource minière clé pour le Niger.",
    educationLink: '/education/matieres-premieres',
  },
  {
    symbol: 'U3O8',
    name: 'Uranium (lb)',
    type: 'commodity',
    unit: 'USD/lb',
    currency: 'USD',
    maxStalenessHours: 72, // Uranium trades less frequently
    providers: [
      { name: 'yahoo', ticker: 'UX=F' },
      { name: 'trading-economics', ticker: 'uranium' },
    ],
    description:
      "Prix de la livre d'uranium (U₃O₈). Ressource stratégique du Niger, premier producteur africain, essentielle pour l'industrie nucléaire mondiale.",
    educationLink: '/education/matieres-premieres',
  },
  {
    symbol: 'CT',
    name: 'Coton',
    type: 'commodity',
    unit: 'USD/lb',
    currency: 'USD',
    maxStalenessHours: 24,
    providers: [
      { name: 'yahoo', ticker: 'CT=F' },
      { name: 'trading-economics', ticker: 'cotton' },
    ],
    description:
      "Prix de la livre de coton. Culture d'exportation majeure pour plusieurs pays de l'UEMOA dont le Niger.",
    educationLink: '/education/matieres-premieres',
  },

  // ── Indices ─────────────────────────────────────────────────
  {
    symbol: 'BRVMC',
    name: 'BRVM Composite',
    type: 'index',
    unit: 'PTS',
    currency: 'XOF',
    maxStalenessHours: 48, // BRVM only trades weekdays
    providers: [{ name: 'brvm', ticker: 'composite' }],
    description:
      "Indice principal de la Bourse Régionale des Valeurs Mobilières d'Abidjan, regroupant toutes les sociétés cotées de l'UEMOA.",
    educationLink: '/education/bourse-marches',
  },
  {
    symbol: 'IXIC',
    name: 'Nasdaq Composite',
    type: 'index',
    unit: 'PTS',
    currency: 'USD',
    maxStalenessHours: 24,
    providers: [{ name: 'yahoo', ticker: '^IXIC' }],
    description:
      'Indice regroupant plus de 3 000 valeurs cotées au Nasdaq, fortement orienté vers les entreprises technologiques américaines.',
    educationLink: '/education/bourse-marches',
  },
  {
    symbol: 'GSPC',
    name: 'S&P 500',
    type: 'index',
    unit: 'PTS',
    currency: 'USD',
    maxStalenessHours: 24,
    providers: [{ name: 'yahoo', ticker: '^GSPC' }],
    description:
      'Indice regroupant les 500 plus grandes entreprises cotées aux États-Unis, pondéré par capitalisation boursière. Référence mondiale des marchés actions.',
    educationLink: '/education/bourse-marches',
  },
  {
    symbol: 'SXXP',
    name: 'STOXX Europe 600',
    type: 'index',
    unit: 'PTS',
    currency: 'EUR',
    maxStalenessHours: 24,
    providers: [{ name: 'yahoo', ticker: '^STOXX' }],
    description:
      'Indice boursier européen regroupant 600 grandes, moyennes et petites capitalisations de 17 pays européens.',
    educationLink: '/education/bourse-marches',
  },

  // ── Crypto ──────────────────────────────────────────────────
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    type: 'crypto',
    unit: 'USD',
    currency: 'USD',
    maxStalenessHours: 1, // Crypto trades 24/7
    providers: [{ name: 'coingecko', ticker: 'bitcoin' }],
    description:
      'Première cryptomonnaie décentralisée, créée en 2009 par Satoshi Nakamoto. Référence du marché des actifs numériques avec la plus grande capitalisation.',
    educationLink: '/education/cryptomonnaies',
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    type: 'crypto',
    unit: 'USD',
    currency: 'USD',
    maxStalenessHours: 1,
    providers: [{ name: 'coingecko', ticker: 'ethereum' }],
    description:
      'Deuxième cryptomonnaie par capitalisation. Plateforme de contrats intelligents (smart contracts) et base de la finance décentralisée (DeFi).',
    educationLink: '/education/cryptomonnaies',
  },
];

/** Lookup asset config by symbol */
export function getAssetConfig(symbol: string): AssetConfig | undefined {
  return ASSET_CONFIGS.find((a) => a.symbol === symbol);
}

/** Get all assets of a given type */
export function getAssetsByType(type: AssetConfig['type']): AssetConfig[] {
  return ASSET_CONFIGS.filter((a) => a.type === type);
}

// ────────────────────────────────────────────────────────────────────────────
// Single source of truth for ALL pricing, plans, and payment methods.
// Import from here everywhere — never hardcode prices elsewhere.
// ────────────────────────────────────────────────────────────────────────────

export const CURRENCY = 'FCFA';

// ─── Premium tier ────────────────────────────────────────────────────────────

export const PREMIUM_MONTHLY_PRICE = 2_500;

export interface PremiumTier {
  id: 'premium';
  name: string;
  price: number;
  label: string;
  features: string[];
}

export const PREMIUM_TIER: PremiumTier = {
  id: 'premium',
  name: 'Premium',
  price: PREMIUM_MONTHLY_PRICE,
  label: `${PREMIUM_MONTHLY_PRICE.toLocaleString('fr-FR')} ${CURRENCY}/mois`,
  features: [
    'Accès illimité à tous les articles',
    'Analyses et rapports complets',
    'Newsletter hebdomadaire',
    'Alertes actualités majeures',
    'Accès à tous les outils premium',
  ],
};

export const FREE_TIER_FEATURES = [
  'Articles gratuits illimités',
  '3 articles premium par mois',
  'Newsletter mensuelle',
  'Outils de base',
];

// ─── Helpers ────────────────────────────────────────────────────────────────

export function formatPrice(amount: number): string {
  return `${amount.toLocaleString('fr-FR')} ${CURRENCY}`;
}

// ─── Payment methods (Nita & Amana) ─────────────────────────────────────────

export type PaymentMethodId = 'nita' | 'amana';

export interface PaymentMethod {
  id: PaymentMethodId;
  name: string;
  shortName: string;
  instructions: string;
  recipientNumber: string;
  recipientName: string;
}

export const PAYMENT_METHODS: Record<PaymentMethodId, PaymentMethod> = {
  nita: {
    id: 'nita',
    name: 'Nita Transfert d\'Argent',
    shortName: 'Nita',
    instructions: 'Effectuez votre transfert via Nita au numéro ci-dessous, puis saisissez votre numéro de transaction.',
    recipientNumber: '+227 98 54 38 37',
    recipientName: 'NFI REPORT',
  },
  amana: {
    id: 'amana',
    name: 'Amana Transfert d\'Argent',
    shortName: 'Amana',
    instructions: 'Effectuez votre transfert via Amana au numéro ci-dessous, puis saisissez votre numéro de transaction.',
    recipientNumber: '+227 98 54 38 37',
    recipientName: 'NFI REPORT',
  },
};

// ─── Payment request status ─────────────────────────────────────────────────

export type PaymentStatus = 'pending' | 'verified' | 'rejected';

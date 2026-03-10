// ────────────────────────────────────────────────────────────────────────────
// Single source of truth for ALL pricing, plans, and payment methods.
// Import from here everywhere — never hardcode prices elsewhere.
// ────────────────────────────────────────────────────────────────────────────

export const CURRENCY = 'FCFA';

// ─── Billing cycles ─────────────────────────────────────────────────────────

export type BillingCycle = 'monthly' | 'quarterly' | 'yearly';

export interface BillingOption {
  cycle: BillingCycle;
  price: number;
  label: string;
  durationLabel: string;
  durationMonths: number;
  savings?: string;
}

export const BILLING_OPTIONS: BillingOption[] = [
  {
    cycle: 'monthly',
    price: 5_000,
    label: '5 000 FCFA/mois',
    durationLabel: '1 mois',
    durationMonths: 1,
  },
  {
    cycle: 'quarterly',
    price: 10_000,
    label: '10 000 FCFA/3 mois',
    durationLabel: '3 mois',
    durationMonths: 3,
    savings: 'Économisez 5 000 FCFA',
  },
  {
    cycle: 'yearly',
    price: 50_000,
    label: '50 000 FCFA/an',
    durationLabel: '1 an',
    durationMonths: 12,
    savings: 'Économisez 10 000 FCFA',
  },
];

export const PREMIUM_MONTHLY_PRICE = 5_000;

// ─── Premium tier ───────────────────────────────────────────────────────────

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
  label: `À partir de ${PREMIUM_MONTHLY_PRICE.toLocaleString('fr-FR')} ${CURRENCY}/mois`,
  features: [
    'Accès illimité à tous les articles',
    'Analyses et rapports complets',
    'Accès à tous les cours d\'éducation financière',
    '2 newsletters exclusives par semaine - briefing du lundi et bilan du vendredi',
    'Alertes en temps réel sur les actualités majeures',
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

export function getBillingOption(cycle: BillingCycle): BillingOption {
  return BILLING_OPTIONS.find((b) => b.cycle === cycle) || BILLING_OPTIONS[0];
}

export function isValidBillingCycle(cycle: string): cycle is BillingCycle {
  return ['monthly', 'quarterly', 'yearly'].includes(cycle);
}

export function getBillingCycleLabel(cycle: string): string {
  switch (cycle) {
    case 'monthly': return 'Mensuel';
    case 'quarterly': return 'Trimestriel';
    case 'yearly': return 'Annuel';
    default: return 'Mensuel';
  }
}

// ─── Payment methods (Nita & Amana) ─────────────────────────────────────────

export type PaymentMethodId = 'nita' | 'amana';

export interface PaymentMethod {
  id: PaymentMethodId;
  name: string;
  shortName: string;
  logo: string;
  instructions: string;
  recipientNumber: string;
  recipientName: string;
}

export const PAYMENT_METHODS: Record<PaymentMethodId, PaymentMethod> = {
  nita: {
    id: 'nita',
    name: 'Nita Transfert d\'Argent',
    shortName: 'Nita',
    logo: '/nita.png',
    instructions: 'Effectuez votre transfert via Nita au numéro ci-dessous, puis saisissez votre numéro de transaction.',
    recipientNumber: '+227 98 54 38 37',
    recipientName: 'NFI REPORT',
  },
  amana: {
    id: 'amana',
    name: 'Amana Transfert d\'Argent',
    shortName: 'Amana',
    logo: '/amana.png',
    instructions: 'Effectuez votre transfert via Amana au numéro ci-dessous, puis saisissez votre numéro de transaction.',
    recipientNumber: '+227 98 54 38 37',
    recipientName: 'NFI REPORT',
  },
};

// ─── Payment request status ─────────────────────────────────────────────────

export type PaymentStatus = 'pending' | 'verified' | 'rejected';

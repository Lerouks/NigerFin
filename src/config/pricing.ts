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

// ─── Payment method types ───────────────────────────────────────────────────

/**
 * Payment flow mode:
 * - 'manual': User transfers money manually, provides transaction number, admin verifies
 * - 'api': Automated via provider API (initiate → callback → auto-verify)
 */
export type PaymentMode = 'manual' | 'api';

/**
 * Provider status:
 * - 'active': Available for use now
 * - 'coming_soon': Displayed in UI but not selectable (waiting for API keys)
 */
export type PaymentMethodStatus = 'active' | 'coming_soon';

export type ManualPaymentMethodId = 'nita' | 'amana';
export type MobileMoneyProviderId = 'orange_money' | 'moov_money' | 'airtel_money';
export type PaymentMethodId = ManualPaymentMethodId | MobileMoneyProviderId;

// ─── Payment method interfaces ──────────────────────────────────────────────

interface PaymentMethodBase {
  id: PaymentMethodId;
  name: string;
  shortName: string;
  logo: string;
  status: PaymentMethodStatus;
}

export interface ManualPaymentMethod extends PaymentMethodBase {
  id: ManualPaymentMethodId;
  mode: 'manual';
  instructions: string;
  recipientNumber: string;
  recipientName: string;
}

export interface MobileMoneyPaymentMethod extends PaymentMethodBase {
  id: MobileMoneyProviderId;
  mode: 'api';
  /** Provider identifier used by the payment-providers registry */
  providerId: MobileMoneyProviderId;
  /** User-facing description shown before initiating payment */
  description: string;
}

export type PaymentMethod = ManualPaymentMethod | MobileMoneyPaymentMethod;

// ─── Payment methods (manual transfer) ──────────────────────────────────────

export const MANUAL_PAYMENT_METHODS: Record<ManualPaymentMethodId, ManualPaymentMethod> = {
  nita: {
    id: 'nita',
    mode: 'manual',
    status: 'active',
    name: 'Nita Transfert d\'Argent',
    shortName: 'Nita',
    logo: '/nita.png',
    instructions: 'Effectuez votre transfert via Nita au numéro ci-dessous, puis saisissez votre numéro de transaction.',
    recipientNumber: '+227 97 76 91 31',
    recipientName: 'NFI REPORT',
  },
  amana: {
    id: 'amana',
    mode: 'manual',
    status: 'active',
    name: 'Amana Transfert d\'Argent',
    shortName: 'Amana',
    logo: '/amana.png',
    instructions: 'Effectuez votre transfert via Amana au numéro ci-dessous, puis saisissez votre numéro de transaction.',
    recipientNumber: '+227 97 76 91 31',
    recipientName: 'NFI REPORT',
  },
};

// ─── Payment methods (mobile money API — coming soon) ───────────────────────

export const MOBILE_MONEY_METHODS: Record<MobileMoneyProviderId, MobileMoneyPaymentMethod> = {
  orange_money: {
    id: 'orange_money',
    mode: 'api',
    status: 'coming_soon',
    providerId: 'orange_money',
    name: 'Orange Money',
    shortName: 'Orange Money',
    logo: '/payment-providers/orange-money.svg',
    description: 'Payez directement depuis votre compte Orange Money. Le paiement est instantané.',
  },
  moov_money: {
    id: 'moov_money',
    mode: 'api',
    status: 'coming_soon',
    providerId: 'moov_money',
    name: 'Moov Money',
    shortName: 'Moov Money',
    logo: '/payment-providers/moov-money.svg',
    description: 'Payez directement depuis votre compte Moov Money. Le paiement est instantané.',
  },
  airtel_money: {
    id: 'airtel_money',
    mode: 'api',
    status: 'coming_soon',
    providerId: 'airtel_money',
    name: 'Airtel Money',
    shortName: 'Airtel Money',
    logo: '/payment-providers/airtel-money.svg',
    description: 'Payez directement depuis votre compte Airtel Money. Le paiement est instantané.',
  },
};

// ─── Unified payment methods registry ───────────────────────────────────────

export const PAYMENT_METHODS: Record<PaymentMethodId, PaymentMethod> = {
  ...MANUAL_PAYMENT_METHODS,
  ...MOBILE_MONEY_METHODS,
};

/** Only methods currently available for payment */
export function getActivePaymentMethods(): PaymentMethod[] {
  return Object.values(PAYMENT_METHODS).filter((m) => m.status === 'active');
}

/** All methods including coming soon (for UI display) */
export function getAllPaymentMethods(): PaymentMethod[] {
  return Object.values(PAYMENT_METHODS);
}

/** Type guard: is this a manual transfer method? */
export function isManualPaymentMethod(method: PaymentMethod): method is ManualPaymentMethod {
  return method.mode === 'manual';
}

/** Type guard: is this a mobile money API method? */
export function isMobileMoneyMethod(method: PaymentMethod): method is MobileMoneyPaymentMethod {
  return method.mode === 'api';
}

/** Check if a string is a valid payment method ID */
export function isValidPaymentMethod(id: string): id is PaymentMethodId {
  return id in PAYMENT_METHODS;
}

// ─── Payment request status ─────────────────────────────────────────────────

export type PaymentStatus = 'pending' | 'verified' | 'rejected';

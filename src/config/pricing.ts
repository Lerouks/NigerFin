// ────────────────────────────────────────────────────────────────────────────
// Single source of truth for ALL pricing, plans, and payment methods.
// Import from here everywhere — never hardcode prices elsewhere.
// ────────────────────────────────────────────────────────────────────────────

export const CURRENCY = 'FCFA';

// ─── Tiers ──────────────────────────────────────────────────────────────────

export type TierId = 'standard' | 'pro';
export type BillingCycle = 'monthly' | 'quarterly' | 'yearly';

export interface TierPlan {
  amount: number;
  label: string;
  savings?: string;
  priceId: string;
}

export interface Tier {
  id: TierId;
  name: string;
  role: string;
  features: string[];
  plans: Record<BillingCycle, TierPlan>;
}

// Monthly base prices
const STANDARD_MONTHLY = 4_900;
const PRO_MONTHLY = 9_900;

function discounted(base: number, months: number, discount: number): number {
  return Math.round(base * months * (1 - discount) / 100) * 100;
}

export const TIERS: Record<TierId, Tier> = {
  standard: {
    id: 'standard',
    name: 'Standard',
    role: 'standard',
    features: [
      'Accès illimité aux articles',
      'Analyses et rapports complets',
      'Newsletter hebdomadaire',
      'Alertes actualités majeures',
      'Accès aux outils premium',
    ],
    plans: {
      monthly: {
        amount: STANDARD_MONTHLY,
        label: `${STANDARD_MONTHLY.toLocaleString('fr-FR')} ${CURRENCY}/mois`,
        priceId: process.env.NEXT_PUBLIC_STRIPE_STANDARD_MONTHLY || '',
      },
      quarterly: {
        amount: discounted(STANDARD_MONTHLY, 3, 0.12),
        label: `${discounted(STANDARD_MONTHLY, 3, 0.12).toLocaleString('fr-FR')} ${CURRENCY}/3 mois`,
        savings: '12%',
        priceId: process.env.NEXT_PUBLIC_STRIPE_STANDARD_QUARTERLY || '',
      },
      yearly: {
        amount: discounted(STANDARD_MONTHLY, 12, 0.24),
        label: `${discounted(STANDARD_MONTHLY, 12, 0.24).toLocaleString('fr-FR')} ${CURRENCY}/an`,
        savings: '24%',
        priceId: process.env.NEXT_PUBLIC_STRIPE_STANDARD_YEARLY || '',
      },
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    role: 'pro',
    features: [
      'Tout le plan Standard',
      'Rapports exclusifs PDF',
      'Alertes personnalisées',
      'Archives complètes',
      'Support prioritaire 24h/7j',
    ],
    plans: {
      monthly: {
        amount: PRO_MONTHLY,
        label: `${PRO_MONTHLY.toLocaleString('fr-FR')} ${CURRENCY}/mois`,
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY || '',
      },
      quarterly: {
        amount: discounted(PRO_MONTHLY, 3, 0.09),
        label: `${discounted(PRO_MONTHLY, 3, 0.09).toLocaleString('fr-FR')} ${CURRENCY}/3 mois`,
        savings: '9%',
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_QUARTERLY || '',
      },
      yearly: {
        amount: discounted(PRO_MONTHLY, 12, 0.20),
        label: `${discounted(PRO_MONTHLY, 12, 0.20).toLocaleString('fr-FR')} ${CURRENCY}/an`,
        savings: '20%',
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY || '',
      },
    },
  },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

export function getTierPlan(tier: TierId, cycle: BillingCycle): TierPlan {
  return TIERS[tier].plans[cycle];
}

export function getMonthlyEquivalent(tier: TierId, cycle: BillingCycle): number {
  const plan = TIERS[tier].plans[cycle];
  switch (cycle) {
    case 'monthly': return plan.amount;
    case 'quarterly': return Math.round(plan.amount / 3);
    case 'yearly': return Math.round(plan.amount / 12);
  }
}

export function formatPrice(amount: number): string {
  return `${amount.toLocaleString('fr-FR')} ${CURRENCY}`;
}

export function cycleMonths(cycle: BillingCycle): number {
  switch (cycle) {
    case 'monthly': return 1;
    case 'quarterly': return 3;
    case 'yearly': return 12;
  }
}

export function cycleLabel(cycle: BillingCycle): string {
  switch (cycle) {
    case 'monthly': return '1 mois';
    case 'quarterly': return '3 mois';
    case 'yearly': return '1 an';
  }
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

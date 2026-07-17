// ────────────────────────────────────────────────────────────────────────────
// Single source of truth for ALL pricing, plans, and payment methods.
// Import from here everywhere. Never hardcode prices elsewhere.
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
    price: 13_750,
    label: '13 750 FCFA/3 mois',
    durationLabel: '3 mois',
    durationMonths: 3,
    savings: 'Économisez 1 250 FCFA',
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

// ─── Frais iPayMoney ────────────────────────────────────────────────────────
// iPayMoney preleve ~3% au moment du paiement, a la charge du client par defaut
// (iPay calcule frais = arrondi(montant x 3%) puis les ajoute : 5 000 -> 5 150).
// Pour que le CLIENT paie le prix ROND affiche, on envoie a iPay un montant
// reduit tel que montant + arrondi(montant x 3%) retombe sur le prix affiche.
// Ex : 4 854 + arrondi(145,62) = 4 854 + 146 = 5 000. NFI absorbe donc les ~3%
// (choix Raouf : le client paie un montant rond, pas de frais visibles).
export const IPAYMONEY_FEE_RATE = 0.03;

export function getIPayChargeAmount(displayPrice: number): number {
  return Math.round(displayPrice / (1 + IPAYMONEY_FEE_RATE));
}

// ─── Helpers ────────────────────────────────────────────────────────────────

export function formatPrice(amount: number): string {
  return `${amount.toLocaleString('fr-FR')} ${CURRENCY}`;
}

export function getBillingOption(cycle: BillingCycle): BillingOption {
  return BILLING_OPTIONS.find((b) => b.cycle === cycle) || BILLING_OPTIONS[0]!;
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

// ─── Payment methods (Nita, Amana, iPayMoney) ───────────────────────────────

export type PaymentMethodId = 'nita' | 'amana' | 'ipaymoney';

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
    logo: '/nita-logo.png',
    instructions: 'Effectuez votre transfert via Nita au numéro ci-dessous, puis saisissez votre numéro de transaction.',
    recipientNumber: '+227 91 70 71 94',
    recipientName: 'NFI REPORT',
  },
  amana: {
    id: 'amana',
    name: 'Amana Transfert d\'Argent',
    shortName: 'Amana',
    logo: '/amana-logo.png',
    instructions: 'Effectuez votre transfert via Amana au numéro ci-dessous, puis saisissez votre numéro de transaction.',
    recipientNumber: '+227 91 70 71 94',
    recipientName: 'NFI REPORT',
  },
  ipaymoney: {
    id: 'ipaymoney',
    name: 'iPayMoney (Mobile Money, Visa, Mastercard, Amex)',
    shortName: 'iPayMoney',
    logo: '/ipaymoney-logo.png',
    instructions: 'Vous serez redirigé vers iPayMoney pour payer via Mobile Money (Airtel, Moov) ou par Visa, Mastercard ou American Express.',
    recipientNumber: '',
    recipientName: '',
  },
};

// ─── Payment request status ─────────────────────────────────────────────────

export type PaymentStatus = 'pending' | 'verified' | 'rejected';

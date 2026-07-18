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

// Plafond d'un prix dynamique (override admin). Partage entre la validation
// admin (dynamic_pricing) et le controle anti-fraude du callback iPay.
export const MAX_DYNAMIC_PRICE = 10_000_000;

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
// iPayMoney facture ~3 % au client EN PLUS du montant qu'on lui envoie, et
// ARRONDIT ces frais A L'ENTIER SUPERIEUR (ceil), pas au plus proche. Le total
// reellement debite au client est donc :
//     total = X + Math.ceil(X x 0,03)
// Verifie en production : envoyer 48 544 fait payer 50 001, car
//     ceil(48 544 x 0,03) = ceil(1 456,32) = 1 457  ->  48 544 + 1 457 = 50 001.
// (Pour un entier X, X + ceil(0,03 X) = ceil(1,03 X) : les deux formulations
//  coincident, l'observation ci-dessus fixe le modele sans ambiguite.)
//
// Pour que le CLIENT paie EXACTEMENT le prix rond affiche (NFI absorbe les
// frais, pas de frais visibles), on cherche le plus grand entier X tel que le
// total debite ne DEPASSE JAMAIS le prix affiche, et l'atteigne pile quand
// c'est possible. Garantie forte : quel que soit l'arrondi reel d'iPay (ceil
// etant le pire cas), le client ne paie jamais plus que le prix rond.
export const IPAYMONEY_FEE_RATE = 0.03;

/** Total reellement debite au client par iPay pour un montant `sent` envoye. */
export function ipayCustomerTotal(sent: number): number {
  return sent + Math.ceil(sent * IPAYMONEY_FEE_RATE);
}

/**
 * Montant a envoyer a iPay pour que le client paie EXACTEMENT `displayPrice`.
 * Renvoie le plus grand entier X tel que ipayCustomerTotal(X) <= displayPrice
 * (et = displayPrice quand c'est atteignable). Ne depasse jamais displayPrice.
 */
export function getIPayChargeAmount(displayPrice: number): number {
  if (!Number.isFinite(displayPrice) || displayPrice <= 0) return 0;
  // Estimation analytique (plancher), puis ajustement a la frontiere exacte.
  let sent = Math.floor(displayPrice / (1 + IPAYMONEY_FEE_RATE));
  // Monte tant qu'on peut sans depasser le prix affiche...
  while (ipayCustomerTotal(sent + 1) <= displayPrice) sent++;
  // ...et redescend si l'estimation de depart depassait deja (securite).
  while (sent > 0 && ipayCustomerTotal(sent) > displayPrice) sent--;
  return sent;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

export function formatPrice(amount: number): string {
  return `${amount.toLocaleString('fr-FR')} ${CURRENCY}`;
}

export function getBillingOption(cycle: BillingCycle): BillingOption {
  return BILLING_OPTIONS.find((b) => b.cycle === cycle) || BILLING_OPTIONS[0]!;
}

// ─── Prix canonique (source de verite unique) ───────────────────────────────
// Prix reellement en vigueur pour un cycle = override admin (dynamic_pricing)
// s'il existe, sinon le prix du config. Regle metier : un prix dynamique ne
// peut JAMAIS descendre sous le prix du config (plancher) — garanti ici aussi,
// pas seulement a l'ecriture. Fonction PURE (pas d'I/O) : la lecture DB vit
// dans getServerPrice (src/lib/pricing-server.ts) qui delegue le calcul ici.
// Utiliser partout ou un prix est AFFICHE, ENCAISSE, FACTURE ou VALIDE, pour
// que ces quatre valeurs soient toujours identiques.
export function resolvePrice(cycle: BillingCycle, dynamicAmount?: number | null): number {
  const floor = getBillingOption(cycle).price;
  if (typeof dynamicAmount !== 'number' || !Number.isFinite(dynamicAmount)) return floor;
  // Plancher = prix config ; plafond = MAX_DYNAMIC_PRICE (coherence anti-aberration).
  return Math.min(Math.max(Math.round(dynamicAmount), floor), MAX_DYNAMIC_PRICE);
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

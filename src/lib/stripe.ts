import type { BillingCycle } from '@/types';

export const STRIPE_PLANS = {
  standard: {
    monthly: {
      priceId: process.env.NEXT_PUBLIC_STRIPE_STANDARD_MONTHLY || '',
      amount: 4900,
      label: '4 900 FCFA/mois',
    },
    quarterly: {
      priceId: process.env.NEXT_PUBLIC_STRIPE_STANDARD_QUARTERLY || '',
      amount: 12900,
      label: '12 900 FCFA/3 mois',
      savings: '12%',
    },
    yearly: {
      priceId: process.env.NEXT_PUBLIC_STRIPE_STANDARD_YEARLY || '',
      amount: 44900,
      label: '44 900 FCFA/an',
      savings: '24%',
    },
  },
  pro: {
    monthly: {
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY || '',
      amount: 9900,
      label: '9 900 FCFA/mois',
    },
    quarterly: {
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_QUARTERLY || '',
      amount: 26900,
      label: '26 900 FCFA/3 mois',
      savings: '9%',
    },
    yearly: {
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY || '',
      amount: 94900,
      label: '94 900 FCFA/an',
      savings: '20%',
    },
  },
} as const;

export type StripePlanTier = 'standard' | 'pro';

export function getPlanPrice(tier: StripePlanTier, cycle: BillingCycle) {
  return STRIPE_PLANS[tier][cycle];
}

export function getMonthlyEquivalent(tier: StripePlanTier, cycle: BillingCycle): number {
  const plan = STRIPE_PLANS[tier][cycle];
  switch (cycle) {
    case 'monthly': return plan.amount;
    case 'quarterly': return Math.round(plan.amount / 3);
    case 'yearly': return Math.round(plan.amount / 12);
  }
}

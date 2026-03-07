import type { UserRole } from '@/types';
import { PREMIUM_TIER, BILLING_OPTIONS, type BillingCycle } from '@/config/pricing';

export interface SubscriptionPlan {
  id: 'lecteur' | 'premium';
  name: string;
  price: number;
  priceLabel: string;
  features: string[];
  limits: {
    premiumArticlesPerMonth: number;
    hasUnlimitedArticles: boolean;
    hasReports: boolean;
    hasPdfReports: boolean;
    hasAlerts: boolean;
    hasCustomAlerts: boolean;
    hasPremiumTools: boolean;
    hasArchives: boolean;
    hasPrioritySupport: boolean;
    newsletterFrequency: string;
  };
}

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'lecteur',
    name: 'Lecteur',
    price: 0,
    priceLabel: 'Gratuit',
    features: [
      'Articles gratuits illimités',
      '3 articles premium / mois',
      'Newsletter mensuelle',
      'Outils de base',
    ],
    limits: {
      premiumArticlesPerMonth: 3,
      hasUnlimitedArticles: false,
      hasReports: false,
      hasPdfReports: false,
      hasAlerts: false,
      hasCustomAlerts: false,
      hasPremiumTools: false,
      hasArchives: false,
      hasPrioritySupport: false,
      newsletterFrequency: 'mensuelle',
    },
  },
  {
    id: 'premium',
    name: 'Premium',
    price: PREMIUM_TIER.price,
    priceLabel: PREMIUM_TIER.label,
    features: PREMIUM_TIER.features,
    limits: {
      premiumArticlesPerMonth: -1,
      hasUnlimitedArticles: true,
      hasReports: true,
      hasPdfReports: true,
      hasAlerts: true,
      hasCustomAlerts: true,
      hasPremiumTools: true,
      hasArchives: true,
      hasPrioritySupport: true,
      newsletterFrequency: 'hebdomadaire',
    },
  },
];

export function getPriceForCycle(cycle: BillingCycle): number {
  const option = BILLING_OPTIONS.find((b) => b.cycle === cycle);
  return option?.price ?? BILLING_OPTIONS[0].price;
}

export function canAccessPremiumContent(
  role: UserRole | null,
  premiumArticlesUsed: number
): boolean {
  if (!role || role === 'reader') {
    return premiumArticlesUsed < 3;
  }
  return true;
}

export function canAccessTool(role: UserRole | null, isPremiumTool: boolean): boolean {
  if (!isPremiumTool) return true;
  if (!role) return false;
  return role === 'premium' || role === 'admin';
}

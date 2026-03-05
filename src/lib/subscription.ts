import type { UserRole } from '@/types';

export type SubscriptionTier = 'lecteur' | 'standard' | 'premium';

export interface SubscriptionPlan {
  id: SubscriptionTier;
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
      'Accès aux articles gratuits',
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
    id: 'standard',
    name: 'Populaire',
    price: 4900,
    priceLabel: '4 900 FCFA/mois',
    features: [
      'Accès illimité aux articles',
      'Analyses et rapports complets',
      'Newsletter hebdomadaire',
      'Alertes actualités majeures',
      'Accès aux outils premium',
    ],
    limits: {
      premiumArticlesPerMonth: -1,
      hasUnlimitedArticles: true,
      hasReports: true,
      hasPdfReports: false,
      hasAlerts: true,
      hasCustomAlerts: false,
      hasPremiumTools: true,
      hasArchives: false,
      hasPrioritySupport: false,
      newsletterFrequency: 'hebdomadaire',
    },
  },
  {
    id: 'premium',
    name: 'Pro',
    price: 9900,
    priceLabel: '9 900 FCFA/mois',
    features: [
      'Tout le plan Standard',
      'Rapports exclusifs PDF',
      'Alertes personnalisées',
      'Archives complètes',
      'Support prioritaire 24h/7j',
    ],
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
      newsletterFrequency: 'quotidienne',
    },
  },
];

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
  return role === 'standard' || role === 'pro' || role === 'admin';
}

import { supabase } from './supabase';

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

export async function getUserSubscription(userId: string): Promise<SubscriptionTier> {
  const { data } = await supabase
    .from('subscriptions')
    .select('tier, status')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (!data) return 'lecteur';
  return data.tier as SubscriptionTier;
}

export async function getPremiumArticlesUsed(userId: string): Promise<number> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from('article_access_log')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_premium', true)
    .gte('accessed_at', startOfMonth.toISOString());

  return count || 0;
}

export function canAccessPremiumContent(
  tier: SubscriptionTier,
  premiumArticlesUsed: number
): boolean {
  const plan = subscriptionPlans.find((p) => p.id === tier);
  if (!plan) return false;
  if (plan.limits.hasUnlimitedArticles) return true;
  return premiumArticlesUsed < plan.limits.premiumArticlesPerMonth;
}

export function canAccessTool(tier: SubscriptionTier, isPremiumTool: boolean): boolean {
  if (!isPremiumTool) return true;
  const plan = subscriptionPlans.find((p) => p.id === tier);
  return plan?.limits.hasPremiumTools || false;
}

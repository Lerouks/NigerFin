export type ContentType = 'free' | 'premium';
export type UserRole = 'reader' | 'premium' | 'admin';
export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'past_due' | 'expired' | 'free';

export interface Article {
  _id: string;
  slug: { current: string };
  title: string;
  subtitle?: string;
  excerpt: string;
  category: string;
  sections: string[];
  author: {
    name: string;
    avatar?: { url: string; alt?: string } | string | null;
  };
  publishedAt: string;
  /** Date du dernier UPDATE en base. Sert au JSON-LD dateModified (SEO H-2). */
  updatedAt?: string;
  mainImage: { url: string; alt?: string | null; width?: number; height?: number; caption?: string | null; source?: string | null } | null;
  body: Record<string, unknown>[];
  isPremium: boolean;
  contentType?: ContentType;
  readTime: number;
  tags: string[];
  shareImage?: { url: string; alt?: string } | null;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
  };
}

export interface MarketData {
  id: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
  type: 'currency' | 'commodity' | 'index' | 'crypto';
  symbol: string;
  unit?: string;
  source?: string;
  updatedAt?: string;
  description?: string;
  educationLink?: string;
}

export interface NavigationSection {
  id: string;
  label: string;
  path: string;
  order: number;
}

export interface Comment {
  id: string;
  article_id: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
  parent_comment_id: string | null;
}

export interface UserProfile {
  // Identite + auth
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  blocked: boolean | null;

  // Civilite + identite etendue (pour personnalisation PDF, compta, etc.)
  civility: 'M.' | 'Mme' | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;

  // Naissance
  birth_day: number | null;
  birth_month: number | null;
  birth_year: number | null;

  // Adresse
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  profession: string | null;

  // Abonnement Premium
  subscription_status: SubscriptionStatus;
  billing_cycle: string | null;
  subscription_start: string | null;
  subscription_end: string | null;
  subscription_granted_by: string | null;
  subscription_updated_at: string | null;
  expiration_warning_sent: boolean | null;

  // Compteurs
  premium_articles_read_this_month: number;
  premium_articles_reset_at: string | null;
  newsletter_subscribed: boolean;
  profile_completed: boolean | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  tier: 'premium';
  status: string;
  billing_cycle: 'monthly' | 'quarterly' | 'yearly';
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  price_amount: number;
  created_at: string;
  updated_at: string;
}

export interface NewsletterPreferences {
  newsletter_monthly: boolean;
  newsletter_weekly: boolean;
  alerts_news: boolean;
  alerts_custom: boolean;
  reports_pdf: boolean;
}

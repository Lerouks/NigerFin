export type ContentType = 'free' | 'premium' | 'pro';
export type UserRole = 'reader' | 'standard' | 'pro' | 'admin';
export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'past_due';
export type BillingCycle = 'monthly' | 'quarterly' | 'yearly';

export interface Article {
  _id: string;
  slug: { current: string };
  title: string;
  subtitle?: string;
  excerpt: string;
  category: string;
  author: {
    name: string;
    avatar?: any;
  };
  publishedAt: string;
  mainImage: any;
  body: any[];
  isPremium: boolean;
  contentType?: ContentType;
  readTime: number;
  tags: string[];
  shareImage?: any;
}

export interface MarketData {
  id: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
  type: 'currency' | 'commodity' | 'index';
  symbol: string;
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
  username: string;
  content: string;
  created_at: string;
  parent_comment_id: string | null;
  likes: number;
  isLiked?: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  subscription_status: SubscriptionStatus;
  billing_cycle: BillingCycle | null;
  premium_articles_read_this_month: number;
  premium_articles_reset_at: string;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  tier: string;
  status: string;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  billing_cycle: BillingCycle;
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

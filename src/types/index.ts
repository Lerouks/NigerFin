export type ContentType = 'free' | 'premium';
export type UserRole = 'reader' | 'premium' | 'admin';
export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'past_due';

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
  premium_articles_read_this_month: number;
  premium_articles_reset_at: string;
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

// Types pour NFI REPORT

export type SubscriptionTier = 'Free' | 'Premium' | 'Business';

export interface User {
  id: string;
  email: string;
  name: string;
  subscription: SubscriptionTier;
  avatar?: string;
}

export interface PortableTextBlock {
  _type: string;
  _key: string;
  style?: string;
  children?: Array<{
    _type: string;
    _key: string;
    text: string;
    marks?: string[];
  }>;
  level?: number;
  listItem?: string;
  markDefs?: Array<{
    _key: string;
    _type: string;
    href?: string;
  }>;
  asset?: {
    _ref: string;
    url: string;
  };
  alt?: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  excerpt: string;
  category: string;
  author: {
    name: string;
    avatar?: string;
  };
  publishedAt: string;
  imageUrl: string;
  content: PortableTextBlock[];
  isPremium: boolean;
  views: number;
  readTime: number;
  tags: string[];
}

export interface Comment {
  id: string;
  articleId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
  likes: number;
  isLiked?: boolean;
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

export interface NewsletterSubscriber {
  email: string;
  subscribedAt: string;
}

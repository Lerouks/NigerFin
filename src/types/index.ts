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
  readTime: number;
  tags: string[];
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
  user_name: string;
  content: string;
  likes: number;
  created_at: string;
  isLiked?: boolean;
}

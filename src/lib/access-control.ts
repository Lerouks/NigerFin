import type { ContentType, UserRole } from '@/types';

const VISITOR_ARTICLE_LIMIT = 3;
const READER_PREMIUM_LIMIT = 3;

// ─── Visitor (not logged in) article tracking ────────────────────────────────

const VISITOR_STORAGE_KEY = 'nfi_visitor_articles';

interface VisitorArticleData {
  slugs: string[];
  resetAt: string;
}

function getVisitorData(): VisitorArticleData {
  if (typeof window === 'undefined') return { slugs: [], resetAt: '' };
  try {
    const raw = localStorage.getItem(VISITOR_STORAGE_KEY);
    if (!raw) return { slugs: [], resetAt: getNextMonthReset() };
    const data = JSON.parse(raw) as VisitorArticleData;
    // Auto-reset if past the reset date
    if (new Date(data.resetAt) <= new Date()) {
      const fresh = { slugs: [], resetAt: getNextMonthReset() };
      localStorage.setItem(VISITOR_STORAGE_KEY, JSON.stringify(fresh));
      return fresh;
    }
    return data;
  } catch {
    return { slugs: [], resetAt: getNextMonthReset() };
  }
}

function getNextMonthReset(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1, 1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function getVisitorArticlesRead(): number {
  return getVisitorData().slugs.length;
}

export function canVisitorReadArticle(slug: string): boolean {
  const data = getVisitorData();
  if (data.slugs.includes(slug)) return true; // Already read this one
  return data.slugs.length < VISITOR_ARTICLE_LIMIT;
}

export function trackVisitorArticle(slug: string): void {
  if (typeof window === 'undefined') return;
  const data = getVisitorData();
  if (!data.slugs.includes(slug)) {
    data.slugs.push(slug);
    localStorage.setItem(VISITOR_STORAGE_KEY, JSON.stringify(data));
  }
}

export function getVisitorLimit(): number {
  return VISITOR_ARTICLE_LIMIT;
}

// ─── Content access rules ────────────────────────────────────────────────────

export type AccessResult =
  | { allowed: true }
  | { allowed: false; reason: 'login_required' | 'paywall_reader' | 'visitor_limit' };

export function checkArticleAccess(
  contentType: ContentType,
  userRole: UserRole | null,
  premiumArticlesReadThisMonth: number,
  articleSlug: string
): AccessResult {
  // Not logged in
  if (!userRole) {
    if (contentType === 'free') {
      if (canVisitorReadArticle(articleSlug)) {
        return { allowed: true };
      }
      return { allowed: false, reason: 'visitor_limit' };
    }
    return { allowed: false, reason: 'login_required' };
  }

  // Admin always has access
  if (userRole === 'admin') return { allowed: true };

  // Free content: accessible to all logged-in users
  if (contentType === 'free') return { allowed: true };

  // Premium content
  if (contentType === 'premium') {
    if (userRole === 'premium') return { allowed: true };
    // Reader: check monthly limit
    if (premiumArticlesReadThisMonth < READER_PREMIUM_LIMIT) {
      return { allowed: true };
    }
    return { allowed: false, reason: 'paywall_reader' };
  }

  return { allowed: true };
}

export function getContentTypeFromArticle(article: { isPremium?: boolean; contentType?: ContentType }): ContentType {
  if (article.contentType) return article.contentType;
  return article.isPremium ? 'premium' : 'free';
}

export function canAccessTool(userRole: UserRole | null, isPremiumTool: boolean): boolean {
  if (!isPremiumTool) return true;
  if (!userRole) return false;
  return userRole === 'premium' || userRole === 'admin';
}

export function getReaderPremiumLimit(): number {
  return READER_PREMIUM_LIMIT;
}

import type { ContentType, UserRole } from '@/types';

const VISITOR_ARTICLE_LIMIT = 3;
const DEFAULT_READER_PREMIUM_LIMIT = 3;

// ─── Visitor (not logged in) article tracking ────────────────────────────────
//
// Sec H-7 (audit 2026-05-22) : le compteur "3 articles free / mois pour visiteurs
// anonymes" est volontairement stocke en localStorage cote client. Un visiteur
// motive peut le clear via DevTools pour lire plus que 3 articles free.
//
// On accepte ce trade-off pour les raisons suivantes :
//   1. Le risque securite est NUL : tout le contenu vise par cette limite est
//      du contenu FREE par definition.
//   2. Le contenu PREMIUM est protege server-side dans
//      /api/articles/[slug]/content/route.ts (verifie role + subscription_end
//      + compteur mensuel persiste dans premium_article_tracking).
//   3. Implementer un counter server-side cote anonyme imposerait soit un cookie
//      signe HMAC (complexite + GDPR : tracker sans consentement), soit une
//      cle IP (cassee sur les reseaux mobile Niger ou des centaines d'utilisateurs
//      partagent une meme NAT). Cout/benefice negatif.
//
// Si demain le business cible explicitement la conversion visiteurs => readers
// connectes, on pourra ajouter un cookie signe avec un sliding window de comptage.

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

function canVisitorReadArticle(slug: string): boolean {
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

// ─── Content access rules ────────────────────────────────────────────────────

export type AccessResult =
  | { allowed: true }
  | { allowed: false; reason: 'login_required' | 'paywall_reader' | 'visitor_limit' };

export function checkArticleAccess(
  contentType: ContentType,
  userRole: UserRole | null,
  premiumArticlesReadThisMonth: number,
  articleSlug: string,
  readerPremiumLimit: number = DEFAULT_READER_PREMIUM_LIMIT
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
    if (premiumArticlesReadThisMonth < readerPremiumLimit) {
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

export function getReaderPremiumLimit(configuredLimit?: number): number {
  return configuredLimit ?? DEFAULT_READER_PREMIUM_LIMIT;
}

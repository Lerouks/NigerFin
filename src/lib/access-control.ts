import type { ContentType, UserRole } from '@/types';

/**
 * Articles Premium offerts chaque mois à un compte gratuit. C'est la seule source
 * de ce nombre : la page de l'article, le mur Premium et le serveur
 * (/api/articles/[slug]/content) le lisent tous ici.
 */
export const DEFAULT_READER_PREMIUM_LIMIT = 3;

// ─── Règles d'accès aux articles ─────────────────────────────────────────────
//
// Sans compte, on lit tous les articles gratuits. L'ancien compteur « 3 articles
// gratuits par mois », gardé dans le navigateur du visiteur, ne bloquait plus rien :
// il a été retiré le 27/11/2026. Le contenu Premium reste protégé par le serveur
// (rôle, abonnement en cours et compteur mensuel de premium_article_tracking).

export type AccessResult =
  | { allowed: true }
  | { allowed: false; reason: 'login_required' | 'paywall_reader' };

export function checkArticleAccess(
  contentType: ContentType,
  userRole: UserRole | null,
  premiumArticlesReadThisMonth: number,
  readerPremiumLimit: number = DEFAULT_READER_PREMIUM_LIMIT
): AccessResult {
  // Sans compte : le gratuit est ouvert, le Premium demande un compte.
  if (!userRole) {
    if (contentType === 'free') return { allowed: true };
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

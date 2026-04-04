# CONTROLE D'ACCES

### 13. Fichier access-control.ts complet

Fichier : src/lib/access-control.ts

```typescript
import type { ContentType, UserRole } from '@/types';

const VISITOR_ARTICLE_LIMIT = 3;
const DEFAULT_READER_PREMIUM_LIMIT = 3;

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
  if (data.slugs.includes(slug)) return true;
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
  if (!userRole) {
    if (contentType === 'free') {
      if (canVisitorReadArticle(articleSlug)) return { allowed: true };
      return { allowed: false, reason: 'visitor_limit' };
    }
    return { allowed: false, reason: 'login_required' };
  }
  if (userRole === 'admin') return { allowed: true };
  if (contentType === 'free') return { allowed: true };
  if (contentType === 'premium') {
    if (userRole === 'premium') return { allowed: true };
    if (premiumArticlesReadThisMonth < readerPremiumLimit) return { allowed: true };
    return { allowed: false, reason: 'paywall_reader' };
  }
  return { allowed: true };
}

export function canAccessTool(userRole: UserRole | null, isPremiumTool: boolean): boolean {
  if (!isPremiumTool) return true;
  if (!userRole) return false;
  return userRole === 'premium' || userRole === 'admin';
}

export function getReaderPremiumLimit(configuredLimit?: number): number {
  return configuredLimit ?? DEFAULT_READER_PREMIUM_LIMIT;
}
```

### 14. Middleware

Fichier : src/middleware.ts

Le middleware ne fait PAS de redirections ni de protection de routes. Il sert uniquement a rafraichir le token Supabase sur chaque requete :

```typescript
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.next();

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  try { await supabase.auth.getUser(); } catch { /* non-critical */ }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
```

### 15. Routes protegees

Il n'y a PAS de protection cote middleware. La protection se fait :

1. Cote API (serveur) : chaque route API verifie supabase.auth.getUser() et renvoie 401 si non authentifie. Les routes admin utilisent requireAdmin() de src/lib/admin-auth.ts.
2. Cote client : le AuthContext expose isSignedIn et userRole. Les composants comme PremiumOverlay verifient le role et affichent le paywall.
3. Outils premium : verifies via canAccessTool(userRole, isPremiumTool).

### 16. PremiumOverlay.tsx

Fichier : src/components/PremiumOverlay.tsx (529 lignes)

Le composant gere 6 cas d'overlay selon l'etat de l'utilisateur :

| Cas | Condition | Comportement |
|-----|-----------|-------------|
| not_connected | Pas connecte + article premium | Bloquant a 30% scroll. Champ email + CTA login/inscription |
| connected_has_articles | Reader + articles premium restants | Non-bloquant a 40% scroll. Compteur "Il vous reste X articles" + CTA continuer |
| connected_no_articles | Reader + 0 articles restants | Bloquant a 30% scroll. CTA vers pricing |
| reader_has_articles | Reader avec articles restants | Non-bloquant a 40% scroll. Compteur + CTA |
| reader_no_articles | Reader + limite atteinte | Bloquant a 30% scroll. CTA vers pricing |
| premium / admin | Premium ou Admin | Aucun overlay (retourne null) |

Fonctionnalites techniques :
- Trigger au scroll (configurable via paywall_config.scroll_percent)
- Focus trap + gestion clavier (Escape, Tab)
- Dismiss tracke en localStorage (4h cooldown pour non-bloquant)
- Analytics envoyees a /api/paywall/analytics (view, dismiss, click, continue_reading)
- Session ID via sessionStorage + crypto.randomUUID()
- Limite configurable dynamiquement via /api/paywall-config


# CONTENU ET ARTICLES

### 17. Structure d'un article dans Supabase

Table articles :

| Colonne | Type | Detail |
|---------|------|--------|
| id | uuid PK | |
| title | text NOT NULL | |
| subtitle | text | |
| slug | text NOT NULL UNIQUE | |
| excerpt | text | |
| category | text | |
| sections | text[] | default '{}' |
| content_type | text NOT NULL | 'free' ou 'premium' (CHECK) |
| is_featured | boolean | default false |
| featured_order | integer | |
| author_name | text | |
| author_avatar | text | |
| main_image_url | text | |
| main_image_alt | text | |
| main_image_caption | text | |
| body | text | Contenu complet de l'article |
| read_time | integer | En minutes |
| tags | text[] | default '{}' |
| seo_title | text | |
| seo_description | text | |
| status | text NOT NULL | 'draft' / 'published' / 'archived' (CHECK) |
| published_at | timestamptz | |
| created_at / updated_at | timestamptz | |

### 18. Distinction article gratuit vs premium

Le champ content_type dans la table articles : valeur 'free' ou 'premium'.

```typescript
export function getContentTypeFromArticle(article: { isPremium?: boolean; contentType?: ContentType }): ContentType {
  if (article.contentType) return article.contentType;
  return article.isPremium ? 'premium' : 'free';
}
```

### 19. Troncature / blocage du contenu

Le blocage est COTE CLIENT UNIQUEMENT via PremiumOverlay :

1. L'article complet est charge (le body est envoye au client)
2. Le PremiumOverlay se superpose a 30-40% du scroll selon le cas
3. En mode bloquant : document.body.style.overflow = 'hidden' + backdrop noir empeche le scroll
4. En mode non-bloquant : l'overlay est dismissable et l'utilisateur peut continuer

Il n'y a PAS de troncature cote serveur -- le contenu complet transite dans la reponse. La protection repose sur l'overlay CSS/JS.

### 20. Categories et regles d'acces differentes

Les categories (economie, finance, marches, niger, education, entreprises) sont des sections de navigation, pas des regles d'acces. Chaque article a son propre content_type independamment de sa categorie.

Il n'y a PAS de regle d'acces par categorie. L'acces depend uniquement de content_type (free/premium) x userRole (reader/premium/admin).

Exception : les outils (/outils) ont leur propre flag isPremiumTool verifie via canAccessTool().

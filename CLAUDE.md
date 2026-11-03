# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NFI Report is a French-language economic and financial news site for Niger and West Africa, built with Next.js 16 (App Router, webpack build), React 19, Supabase, and Tailwind CSS. Deployed on Vercel.

## Commands

- `npm run dev` — Start dev server
- `npm run build` — Production build (wrapped with Sentry + bundle analyzer)
- `npm run lint` — ESLint via `next lint`
- `npm run test` — Run all tests with Vitest (`vitest run`)
- `npm run test:watch` — Watch mode tests
- `npm run analyze` — Bundle analysis build (`ANALYZE=true`)

Tests live in `src/__tests__/*.test.ts` and match the pattern `src/**/*.test.ts`. Setup file: `src/__tests__/setup.ts`. The `@` alias resolves to `src/`.

## Architecture

**Stack:** Next.js 16 (App Router, webpack build forcé via `--webpack` car Sentry v8 pas encore compatible Turbopack), React 19, Supabase (auth + DB + Storage), iPayMoney (payments Mobile Money & carte), Tailwind CSS 3, TipTap (rich text editor), Recharts, Sentry, PostHog analytics, Resend (transactional email + newsletter envoi self-hosted), React-PDF (génération PDF facture).

**Routing:** French-language routes under `src/app/` — e.g., `/articles`, `/economie`, `/finance`, `/marches`, `/niger`, `/education`, `/entreprises`, `/outils`, `/compte`, `/paiement`, `/pricing`, `/admin`. Auth routes use a route group `(auth)/` with `/connexion` and `/inscription`.

**API Routes:** Extensive API at `src/app/api/` covering: articles, auth, comments, contact, cron jobs, discussions, education, flash-banner, ipaymoney, legal-sections, likes, market-data, newsletter, payment, paywall, prices, site-settings, tools, user profile, and admin operations.

**Supabase clients** (`src/lib/supabase.ts`):
- `createServerSupabaseClient()` — Server components/API routes (uses cookies)
- `createServiceClient()` — Admin operations (service role key)
- `createBrowserSupabaseClient()` — Client-side (from `supabase-browser.ts`)

**Proxy** (`src/proxy.ts`, anciennement `middleware.ts` avant Next 16): Refreshes Supabase auth tokens on every request.

**Content model:** Articles have `ContentType` (free/premium), users have `UserRole` (reader/premium/admin), subscriptions tracked via `SubscriptionStatus`. Access control in `src/lib/access-control.ts`.

**Key libraries:**
- `src/lib/` — Core utilities: validation, rate-limit, pagination, audit, email templates, API error handling
- `src/components/` — Shared components including Header, Footer, ArticleCard, PremiumOverlay, RichTextEditor, MarketDataWidget, SearchOverlay
- `src/config/pricing.ts` — Pricing configuration
- `src/types/` — TypeScript types including Supabase generated types

**Convention nommage composants admin (`src/app/admin/`)** (LOW-QUAL-2 du code review 2026-05-22) :
- `XxxManager.tsx` : composants CRUD complets avec liste + edit + delete (Articles, Education, FlashBanner, LegalSections, MarketData, Messages, NigerPresentation, Notifications, Paywall, SiteFeatures, StrategicEnterprises, Comments).
- `XxxTab.tsx` : pages-onglets du Cockpit principal (Audit, Overview, Payments, Pricing, Users) - presentationnels, consomment des datas via hooks.
- `XxxView.tsx` : vues read-only avec drill-down (CockpitView, SiteView).
- `XxxStats.tsx` : sous-blocs KPI dans une page parent (ContenuStats, UsersStats).

**Cron jobs** (configured in `vercel.json`): Daily subscription expiration check (2 AM) and expiration warning emails (8 AM).

**Design tokens:** Custom Tailwind colors (background: `#fafaf9`, foreground: `#1a1a1a`, primary: `#111111`, secondary: `#f5f5f0`, muted: `#f0efe9`, gold: `#d4a843`). Font: Inter (body and headings), loaded as a local font.

**Figma source:** Design originates from Figma file `Lv7u6t8ImmhJDTmgUnHZwa`.

## Règles de travail obligatoires (à respecter à chaque session)

### 1. Responsive — Vérification systématique sur 3 formats
À CHAQUE modification touchant l'UI (composants, pages, styles, layouts), vérifier explicitement le rendu et le comportement sur :
- **Desktop/PC** (≥ 1024px)
- **Tablette** (768px – 1023px)
- **Mobile/Téléphone** (< 768px)

Ne jamais considérer une tâche UI comme terminée tant que les trois formats n'ont pas été validés (breakpoints Tailwind `sm:`, `md:`, `lg:`, `xl:`, overflow, lisibilité, interactions tactiles, menus, tableaux, images).

### 2. Builds propres à 100% — Condition de fin non négociable
Une tâche n'est JAMAIS terminée tant que les commandes suivantes ne passent pas toutes **sans erreur ni warning** :
- `npm run lint` — aucune erreur, aucun warning
- `npm run build` — build production réussi
- `npm run test` — tous les tests passent

Si une commande échoue : chercher la cause racine, corriger, relancer. Ne pas contourner, ne pas ignorer, ne pas commenter les tests. Pas de `--no-verify`, pas de `eslint-disable` sans justification explicite.

### 3. Recherche proactive d'erreurs
Lors de chaque modification, ne pas se limiter à la demande stricte. Vérifier activement :
- Les erreurs TypeScript (y compris `any` implicites, types manquants)
- Les erreurs d'accessibilité (a11y : alt, aria, contrastes, navigation clavier)
- Les erreurs de sécurité (XSS, injection, fuites de clés, RLS Supabase)
- Les régressions possibles sur les pages/composants liés
- Les problèmes de performance (re-renders, images non optimisées, bundle size)
- Les liens cassés, les routes manquantes, les imports non utilisés
- La cohérence des traductions/textes français

### 4. Rotation des secrets (durcissement /cso 2026-04-27)

**Rotation périodique** :
- `SUPABASE_SERVICE_ROLE_KEY` : tous les 6 mois (prochaine rotation **2026-10-27**). Procédure dans le suivi interne de sécurité, un fichier local hors du dépôt public.
- `RESEND_API_KEY` : tous les 12 mois.
- `CRON_SECRET`, `REVALIDATE_SECRET` : tous les 12 mois ou immédiatement après tout soupçon de fuite.

**Stockage local** : ne jamais commiter `.env.local`, vérifier régulièrement avec `git ls-files | grep .env` (sortie vide attendue, sauf `.env.local.example`).

**Disque dev** : FileVault doit être actif sur le Mac dev. Vérifier dans Système → Confidentialité et sécurité → FileVault.

### 5. Supabase Data API : REVOKE puis GRANT explicites, obligatoires sur chaque nouvelle table

**Sur ce projet, une table neuve est ouverte à tous dès sa création.** Les droits par défaut du schéma `public` (`pg_default_acl`, relevés en lecture seule en production le 3 novembre 2026) donnent encore TOUS les droits (`arwdDxtm` : lecture, écriture, suppression, TRUNCATE…) à `anon` et `authenticated` sur chaque table créée par `postgres`, et EXECUTE à `anon` et `authenticated` sur chaque fonction neuve (et à `PUBLIC`, comme partout dans PostgreSQL). L'annonce de Supabase selon laquelle les nouvelles tables ne seraient plus exposées par défaut à partir du 30 octobre 2026 ne s'applique pas à ce projet : ne jamais compter dessus. Sans REVOKE, la clé publique du site (`anon`) lit ET modifie la table ; la RLS ne protège que si elle est activée avec des politiques justes, et un droit accordé au niveau de la table a déjà suffi à tout ouvrir (migration 00031).

**Le REVOKE explicite est donc indispensable**, avant tout GRANT, à chaque création de table (dans la migration SQL) :

```sql
-- 1. Créer la table
CREATE TABLE public.ma_nouvelle_table (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- 2. Activer RLS (obligatoire pour toute table publique NFI)
ALTER TABLE public.ma_nouvelle_table ENABLE ROW LEVEL SECURITY;

-- 3. INDISPENSABLE : retirer les droits que les droits par défaut viennent de donner
REVOKE ALL ON public.ma_nouvelle_table FROM PUBLIC, anon, authenticated, service_role;

-- 4. GRANT explicites, uniquement ce dont chaque rôle a besoin
GRANT SELECT ON public.ma_nouvelle_table TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ma_nouvelle_table TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ma_nouvelle_table TO service_role;

-- 5. Policies RLS (ajouter au moins une policy par rôle qui doit accéder)
CREATE POLICY "users read own rows" ON public.ma_nouvelle_table
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
```

**Vérifier après application** (lecture seule) : `select grantee, string_agg(privilege_type, ', ' order by privilege_type) from information_schema.role_table_grants where table_schema = 'public' and table_name = 'ma_nouvelle_table' group by grantee;` doit lister, rôle par rôle, exactement ce qui a été accordé, et rien de plus. Le test `src/__tests__/corbeille-sql.test.ts` (« sur ce projet, le REVOKE est indispensable ») rejoue ces droits par défaut sur une réplique de la production.

**Fonctions SECURITY DEFINER (RPC)** : ne JAMAIS laisser une fonction `SECURITY DEFINER` accessible aux rôles `PUBLIC`, `anon` ou `authenticated` sauf si elle est explicitement conçue pour usage public. Les droits par défaut leur donnent EXECUTE dès la création : le REVOKE est là aussi indispensable. Procédure standard à appliquer après création de toute nouvelle RPC :

```sql
REVOKE ALL ON FUNCTION public.ma_fonction(args) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ma_fonction(args) TO service_role;
```

Appeler ensuite la fonction depuis le code via `createServiceClient().rpc(...)`, jamais via le client client/server lié à l'utilisateur.

**Audit régulier** : lancer `mcp__supabase__get_advisors` (type security) après chaque DDL pour détecter les régressions.

### 6. Suggestions proactives
Si, dans le cadre d'un projet de ce type (site d'actualité économique Next.js + Supabase + iPayMoney), Claude identifie un élément manquant, incomplet, ou améliorable que l'utilisateur n'a pas mentionné (SEO, métadonnées, sitemap, robots.txt, loading states, error boundaries, fallbacks, validation de formulaires, rate limiting, RGPD, etc.), il doit :
1. **Le signaler clairement** à l'utilisateur avec une explication courte du pourquoi
2. **Attendre l'accord explicite** de l'utilisateur
3. **Exécuter la modification** uniquement après accord

Ne jamais exécuter ces ajouts proactifs sans validation préalable.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NFI Report is a French-language economic and financial news site for Niger and West Africa, built with Next.js 15 (App Router), React 19, Supabase, and Tailwind CSS. Deployed on Vercel.

## Commands

- `npm run dev` — Start dev server
- `npm run build` — Production build (wrapped with Sentry + bundle analyzer)
- `npm run lint` — ESLint via `next lint`
- `npm run test` — Run all tests with Vitest (`vitest run`)
- `npm run test:watch` — Watch mode tests
- `npm run analyze` — Bundle analysis build (`ANALYZE=true`)

Tests live in `src/__tests__/*.test.ts` and match the pattern `src/**/*.test.ts`. Setup file: `src/__tests__/setup.ts`. The `@` alias resolves to `src/`.

## Architecture

**Stack:** Next.js 15 App Router, React 19, Supabase (auth + DB), Stripe (payments), Tailwind CSS 3, TipTap (rich text editor), Recharts, Sentry, PostHog analytics, Resend (transactional email), Beehiiv (newsletter).

**Routing:** French-language routes under `src/app/` — e.g., `/articles`, `/economie`, `/finance`, `/marches`, `/niger`, `/education`, `/entreprises`, `/outils`, `/compte`, `/paiement`, `/pricing`, `/admin`. Auth routes use a route group `(auth)/` with `/connexion` and `/inscription`.

**API Routes:** Extensive API at `src/app/api/` covering: articles, auth, comments, contact, cron jobs, discussions, education, flash-banner, legal-sections, likes, market-data, newsletter, payment, paywall, prices, site-settings, stripe, tools, user profile, and admin operations.

**Supabase clients** (`src/lib/supabase.ts`):
- `createServerSupabaseClient()` — Server components/API routes (uses cookies)
- `createServiceClient()` — Admin operations (service role key)
- `createBrowserSupabaseClient()` — Client-side (from `supabase-browser.ts`)

**Middleware** (`src/middleware.ts`): Refreshes Supabase auth tokens on every request.

**Content model:** Articles have `ContentType` (free/premium), users have `UserRole` (reader/premium/admin), subscriptions tracked via `SubscriptionStatus`. Access control in `src/lib/access-control.ts`.

**Key libraries:**
- `src/lib/` — Core utilities: validation, rate-limit, pagination, audit, email templates, API error handling
- `src/components/` — Shared components including Header, Footer, ArticleCard, PremiumOverlay, RichTextEditor, MarketDataWidget, SearchOverlay
- `src/config/pricing.ts` — Pricing configuration
- `src/types/` — TypeScript types including Supabase generated types

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

### 4. Suggestions proactives
Si, dans le cadre d'un projet de ce type (site d'actualité économique Next.js + Supabase + Stripe), Claude identifie un élément manquant, incomplet, ou améliorable que l'utilisateur n'a pas mentionné (SEO, métadonnées, sitemap, robots.txt, loading states, error boundaries, fallbacks, validation de formulaires, rate limiting, RGPD, etc.), il doit :
1. **Le signaler clairement** à l'utilisateur avec une explication courte du pourquoi
2. **Attendre l'accord explicite** de l'utilisateur
3. **Exécuter la modification** uniquement après accord

Ne jamais exécuter ces ajouts proactifs sans validation préalable.

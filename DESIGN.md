# NFI Report Design System

Source of truth for the visual identity, design tokens, and design rules of the NFI Report production site (https://www.nfireport.com).

Last extracted from live production: 2026-05-17.

## Brand Posture

NFI Report is a French-language economic and financial news publication for Niger and West Africa. The design should feel like a serious, modern financial media outlet, closer to Bloomberg, Apple Stocks, or Robinhood than to SikaFinance or regional BRVM news sites. Sober, premium, data-confident, never decorative.

Tagline (short): "La connaissance, votre meilleur capital"
Tagline (long): "La connaissance reste votre meilleur capital"

## Design Tokens

### Colors

| Role | Value | Use |
|------|-------|-----|
| `background` | `#fafaf9` | Surface, page background (warm off-white) |
| `foreground` | `#1a1a1a` | Body text |
| `primary` | `#111111` | Primary action buttons, dark hero blocks |
| `gold` | `#d4a843` | Brand accent (eyebrow labels, premium badge, charts) |
| `success` | `rgb(52, 211, 153)` | Positive price deltas, success states (Tailwind emerald-400) |
| `error` | `rgb(248, 113, 113)` | Negative price deltas, error states (Tailwind red-400) |
| `gray-700` | `rgb(55, 65, 81)` | Secondary text on light backgrounds |
| `gray-500` | `rgb(107, 114, 128)` | Tertiary text, metadata |
| `gray-400` | `rgb(156, 163, 175)` | Disabled, low-emphasis labels |
| `gray-300` | `rgb(209, 213, 219)` | Borders, dividers on light surfaces |

Black surfaces use `#111` for hero blocks (section pages, premium black sections) with white text. Gold (`#d4a843`) is the ONLY accent color; it is reserved for premium badges, eyebrow labels, callouts, and editorial flourishes.

No purple, violet, indigo, magenta, or pastel anywhere. No gradients on text (one exception: gold-to-darker-gold for hero accent on /premium pricing tier highlight).

### Typography

| Family | Use |
|--------|-----|
| Inter (local woff2) | Body, headings, UI everywhere |
| Playfair Display | Reserved for "NFI REPORT" wordmark on social cards and reels outro. Never in product UI. |

Loaded as `localFont` in `src/app/layout.tsx`, weights 400/500/600/700, `display: swap`, served as `--font-inter` CSS variable.

Scale (px, observed on prod):

| Token | Size | Weight | Use |
|-------|------|--------|-----|
| Hero (h2 visual h1) | 48 | 600 | Lead article title on home, page title heroes |
| Section (h2) | 24 | 600 | Section block titles ("Économie", "Marchés"), category heroes |
| Card title (h3) | 17 | 600 | Article card title |
| Subtitle | 18 to 20 | 400 | Article subtitle / hero lede |
| Body | 16 | 400 | Article body, default text |
| UI label | 13 to 14 | 400 to 500 | Buttons, secondary nav, metadata |
| Caption | 11 to 12 | 500 to 700 uppercase | Eyebrow labels, source attributions, badges |

H1 is reserved on the homepage as visually-hidden (`sr-only`) site title for SEO and screen readers. Visual headings start at h2.

Numeric tabular display (price deltas, market data) should use `font-variant-numeric: tabular-nums` so columns of numbers align.

### Spacing

8px base grid via Tailwind. Section vertical padding: `py-14 md:py-20` (56 to 80px). Card padding: `p-5 sm:p-8 md:p-12`. Inner gap inside grids: `gap-4` to `gap-10` depending on density.

Touch targets: primary interactive elements (nav, CTAs, form inputs) must be `min-h-[44px]`. Secondary footer links can be smaller (text-only, 16px is acceptable for WCAG 2.1 AA).

Responsive breakpoints: `sm:640px`, `md:768px`, `lg:1024px`, `xl:1280px`. Container max width `max-w-7xl` (80rem).

### Border-radius

`rounded-md` (6px) for buttons and small chips. `rounded-lg` (8px) for medium cards. `rounded-xl` (12px) for hero article cards, pricing tiers. Never uniform bubbly radius on everything. Inner radius equals outer radius minus gap.

### Motion

- Easing: `ease-out` for entering, `ease-in` for exiting, `ease-in-out` for moving.
- Duration: 200 to 600ms range, defaults around 300ms for hover/UI transitions, 550ms for hero entrance.
- Property whitelist: animate only `transform` and `opacity`. Never animate `width`, `height`, `top`, `left`, or any layout property.
- Respect `prefers-reduced-motion`: motion components fall back to a plain div when set.
- IMPORTANT: do NOT use Framer Motion `whileInView` for content below the initial viewport without a generous `viewport.margin`. IntersectionObserver does not fire on full-page screenshots, social card crawlers, or print views, so content stays at `opacity: 0`. Use `animate` on mount instead. See `src/app/pricing/PricingContent.tsx` and `src/app/premium/PremiumContent.tsx` for the correct pattern.

## Layout Conventions

### Header

Sticky white-with-backdrop-blur header (`sticky top-0 z-50 bg-white/80 backdrop-blur-xl`). Layout:
- Wordmark "NFI REPORT" centered on mobile, left-aligned on desktop
- Right-side cluster: "Se connecter" (when signed-out), "S'abonner" gold-on-black CTA, search icon
- Black secondary nav strip (`bg-[#111] text-white`) on desktop only, with section links. `h-11` (44px tall). Mobile uses a hamburger menu drawer.

### Footer

Black footer (`bg-[#111]`) with 4 columns: brand+description, Rubriques, Société, Suivez-nous. Bottom strip: copyright + legal links + slogan. Footer links can be 16px text without padding (acceptable for tertiary nav).

### Section pages (Économie, Finance, Marchés, Entreprises, Niger, Éducation, Outils)

Black hero with category title (48px) + intro paragraph (text-gray-300). Interactive content first (cours, articles, simulateurs, parcours) right under the hero to prioritize data over description, Bloomberg / Apple Stocks pattern. Article grid uses the `SectionArticlesFiltered` component with filter sidebar on the left (Pertinence, Période, Format, Durée). Cards use the same `ArticleCard` component everywhere.

After the interactive content, a discrete SEO footer (`HubFooter` component) closes the page with a `Comprendre cette rubrique` block: 2/3 column of paragraphs + 1/3 column definition list of highlights, pure typography hierarchy (no colored borders or decorative containers — both would trip the AI slop blacklist).

### Article page

Black hero with section badge ("ÉCONOMIE") + title (h1 visible, 48px on desktop, responsive 24/40/48) + author + date + read time. Full-bleed cover image with negative margin (`-mx-5 sm:-mx-8 md:-mx-12`). Body in `prose`-style typography in the left column (col-8), MarketDataWidget aside in the right column (col-4). Comments, share buttons, related articles below.

### Marketing pages (Premium, Pricing, Outils)

More designed than the rest. /premium uses an Apple-style hero with phone mockup. /connexion uses the most premium pattern: split-screen (dark left + light right). Pricing tiers in a horizontal 3-card layout with "MEILLEUR DEAL" gold badge on the recommended tier.

## Charts and Data

Charts use Recharts in the article body. Price deltas use semantic colors (green up, red down). Tabular numbers in tables/widgets use `tabular-nums`. The MarketDataWidget on the article aside renders a sparkline + price + delta for each market symbol (EUR/XOF, USD/XOF, Or, Brent, Uranium, BRVM Composite, etc).

## Anti-patterns (Hard Rules)

These are the patterns that make a site look AI-generated or sloppy. Hard NO across the entire site:

1. Purple/violet/indigo gradient backgrounds or blue-to-purple color schemes.
2. The 3-column feature grid (icon-in-colored-circle + bold title + 2-line description, repeated 3x symmetrically).
3. Icons in colored circles as section decoration.
4. Centering everything (`text-align: center` on all headings + cards).
5. Uniform bubbly border-radius on every element.
6. Decorative blobs, floating circles, wavy SVG dividers.
7. Emoji as design elements (rockets in headings, emoji as bullet points). Editorial emoji can appear in article body text.
8. Colored left-border on cards (`border-left: 3px solid <accent>`).
9. Generic hero copy ("Welcome to NFI Report", "Unlock the power of...").
10. system-ui or `-apple-system` as the primary display font (the "I gave up on typography" signal).

## Em-dash Hard Rule

NEVER use the em-dash character "—" (U+2014) or en-dash "–" (U+2013) anywhere in code, UI strings, copy, alt text, screenshots, or admin-edited content (banners, articles). Use comma, period, or parentheses instead. This applies to all surfaces including emails, social cards, and PDF receipts.

## Accessibility Floor

- WCAG 2.1 AA on body text (4.5:1 contrast).
- All primary interactive elements `min-h-[44px]` (Apple HIG, WCAG 2.5.5 AAA).
- `focus-visible` ring on all focusable elements. Never `outline: none` without replacement.
- `aria-label` on icon-only buttons.
- `prefers-reduced-motion` respected globally.
- French language (`lang="fr"`) on root html.
- All images have `alt` text. Decorative images use `alt=""`.

## Editorial Surfaces

- Social posts and Instagram carousels use a separate visual system documented in the editorial style guide (`Pipeline contenu/_atelier/`). Wordmark there is Playfair "NFI REPORT" + silver logo. Not the same as web.
- Email receipts (invoices) use the React-PDF Apple-style document in `src/emails/InvoicePdf.tsx`.
- Newsletter HTML emails use the magazine style with gold accents, dropcap on first paragraph, and HeadlineCard component.

## Performance Floor

- LCP < 2.0s on 4G mobile.
- CLS < 0.1.
- Total page weight < 300 KB on initial paint (excludes images).
- Currently observed on /: TTFB 7ms, total load 513ms (production, May 2026).

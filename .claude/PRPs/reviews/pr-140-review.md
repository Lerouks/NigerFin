# PR Review: #140, feat(ux): prioritize interactive content, demote text to footer

**Reviewed**: 2026-05-19
**Author**: Lerouks
**Branch**: feat/ux-content-hierarchy , main
**State**: MERGED (commit d27f48e)
**Decision**: APPROVE with comments

## Summary

Refonte UX cohérente sur 5 pages hub : déplacement du bloc texte explicatif du haut vers le bas. Composant `HubFooter` server-side correctement écrit, SEO préservé, zéro JS supplémentaire, zéro impact CLS/LCP. Bonus fix de 71 escapes Unicode introduit par la régression RSC Next 16. Aucun risque sécurité, aucun problème de logique. Quelques améliorations maintainability et un en-dash résiduel à traiter dans une PR de cleanup ultérieure.

## Findings

### CRITICAL

None.

### HIGH

None.

### MEDIUM

#### M1, contenu de hub hardcodé inline dans 5 fichiers page.tsx

Files concernés :
- src/app/marches/page.tsx, lignes 40 à 51
- src/app/economie/page.tsx, lignes 25 à 36
- src/app/finance/page.tsx, lignes 25 à 36
- src/app/outils/page.tsx, lignes 28 à 39
- src/app/education/page.tsx, lignes 60 à 71

Description : les 3 paragraphes et 4 highlights de chaque rubrique sont des string literals JSX. Pour qu'un rédacteur (non-dev) édite 2 mots, il faut toucher du code, recompiler, redéployer. Cela contredit la pratique d'un site éditorial qui doit pouvoir évoluer rapidement.

Suggested fix : extraire dans `src/content/hub-copy.ts` un dictionnaire typé (`{ marches: { paragraphs, highlights }, economie: ..., ... }`) ou mieux, en table Supabase `hub_copy(slug, paragraphs jsonb, highlights jsonb)` éditable depuis l'admin. Impact : permet édition non-dev, single source of truth, plus facile à i18n si besoin.

Priorité : à traiter dans la prochaine itération éditoriale.

#### M2, `–20` (en-dash) non remplacé dans PremiumContent

File : src/app/premium/PremiumContent.tsx, ligne 30

Le bulk fix unicode escapes a remplacé 71 occurrences (`é`, `’`, etc.) mais a laissé `–20` qui se décode en `15–20 %` (en-dash U+2013). Cela viole la HARD RULE utilisateur "no em-dash/en-dash" documentée dans les feedback memories.

Note : ce caractère existait avant la PR, donc M2 est une opportunité de cleanup manquée plutôt qu'une régression introduite. Le bug RSC d'affichage des escapes ne s'applique pas ici (client component, pas de RSC payload), donc le rendu côté utilisateur est correct (15–20 %), seulement la règle de style perso est violée.

Suggested fix : remplacer `15–20 %` par `15 à 20 %` ou `15-20 %` (hyphen ASCII U+002D autorisé).

### LOW

#### L1, key={p.slice(0, 24)} fragile

File : src/components/HubFooter.tsx, ligne 31

`paragraphs.map((p) => <p key={p.slice(0, 24)}>...</p>)`. Si deux paragraphes commencent identiquement sur les 24 premiers caractères (très peu probable mais possible), collision de keys React, warnings console et re-render incorrects en cas de réordonnancement.

Suggested fix : `paragraphs.map((p, idx) => <p key={`${idx}-${p.slice(0, 24)}`}>...</p>)` ou simplement `key={idx}` puisque les paragraphes sont statiques et l'ordre stable.

#### L2, pas de tests unitaires pour HubFooter

Composant simple (server, pure presentational, props typées) mais l'ajout d'un test snapshot Vitest serait propre et garantirait que le layout grid 2/3 + 1/3 n'est pas cassé par une future modification.

Suggested addition : `src/__tests__/HubFooter.test.tsx` avec snapshot + 1 case "without highlights" + 1 case "custom heading".

#### L3, 34 occurrences pré-existantes en/em-dash dans le repo (observation hors-scope)

Hors PR #140 mais à noter : `grep -rn '–|—' src/` retourne 34 hits dans des composants user-facing (ContactForm "Plateau – BP 800", ToolContent "intérêts — plus du double", admin newsletter, etc.) et techniques (`'—'` comme placeholder). Cleanup à prévoir dans une PR dédiée.

## Validation Results

| Check | Result |
|---|---|
| Type check (`tsc --noEmit`) | Pass |
| Lint (`npm run lint`) | Pass |
| Tests (`npm test`) | Pass (84/84) |
| Build (`npm run build`) | Pass |
| Smoke HTTP prod | Pass (6 routes 200) |
| Encoding regression `/articles` | Fixed (0 `’` dans HTML prod, avant 2) |

## Files Reviewed

- Added : src/components/HubFooter.tsx
- Deleted : src/components/HubIntro.tsx
- Modified : src/app/marches/page.tsx
- Modified : src/app/economie/page.tsx
- Modified : src/app/finance/page.tsx
- Modified : src/app/outils/page.tsx
- Modified : src/app/education/page.tsx
- Modified : src/app/articles/page.tsx (encoding fix)
- Modified : src/app/admin/PaywallManager.tsx (encoding fix)
- Modified : src/app/education/[id]/EducationCategoryContent.tsx (encoding fix)
- Modified : src/app/premium/page.tsx (encoding fix)
- Modified : src/app/premium/PremiumContent.tsx (encoding fix, M2 finding)
- Modified : src/app/pricing/page.tsx (encoding fix)
- Modified : src/app/pricing/PricingContent.tsx (encoding fix)

## Strengths

- Pattern unique appliqué sur 5 pages (cohérence)
- Server component pur, zéro JS supplémentaire, zéro CLS
- SEO préservé (texte en SSR, indexable par les crawlers)
- Mobile-first par défaut (grid 1 col, lg+ 3 col)
- Suppression propre de l'ancien composant HubIntro (no dead code)
- Commit message et PR description exhaustifs
- Validation locale complète avant merge (lint, build, test, screenshots 3 viewports)

## Recommendations

1. PR follow-up court terme : fix M2 (`–20` , `15 à 20 %`) , 1 ligne, 1 commit.
2. PR follow-up moyen terme : externaliser le hub copy en table Supabase éditable (M1).
3. PR follow-up cleanup : nettoyer les 34 occurrences en/em-dash pré-existantes dans le repo (L3).
4. Ajouter un test snapshot pour HubFooter dans la prochaine PR qui touche les hubs.

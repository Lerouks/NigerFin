# NigerFin — Design Guidelines

## Design Tokens

### Couleurs
| Token | Valeur | Usage |
|-------|--------|-------|
| background | `#fafaf9` | Fond de page principal |
| foreground | `#1a1a1a` | Texte principal |
| primary | `#111111` | Boutons, liens, titres |
| secondary | `#f5f5f0` | Fonds secondaires, cartes |
| muted | `#f0efe9` | Fonds atténués, bordures |
| gold | `#d4a843` | Accent premium, badges, highlights |

### Typographie
- **Police** : Inter (chargée en local, body et headings)
- **Hiérarchie** : titres en gras, sous-titres en medium, corps en regular
- **Lisibilité** : line-height généreux pour le contenu éditorial

## Layout

### Mobile-first
- Concevoir d'abord pour mobile (< 768px), puis enrichir pour tablette et desktop
- Breakpoints Tailwind : `sm:` (640px), `md:` (768px), `lg:` (1024px), `xl:` (1280px)

### Principes
- Flexbox et Grid par défaut — éviter le positionnement absolu sauf nécessité
- Whitespace généreux pour la lisibilité (site éditorial/presse)
- Largeur max de contenu cohérente avec les pages existantes
- Pas de scroll horizontal — tester sur toutes les tailles d'écran

## Composants

### Patterns existants à réutiliser
- `ArticleCard` — carte d'article avec image, titre, extrait
- `PremiumOverlay` — overlay pour le contenu premium/paywall
- `MarketDataWidget` — widget données de marché
- `RichTextEditor` — éditeur TipTap pour l'admin
- `SearchOverlay` — recherche globale
- `Header` / `Footer` — navigation et pied de page

### Conventions
- Fichiers composants en PascalCase dans `src/components/`
- Server Components par défaut, `'use client'` uniquement si nécessaire
- Props typées explicitement avec TypeScript

## Esthétique éditoriale

- **Ton visuel** : professionnel, sobre, inspirant confiance (presse économique)
- **Éviter** : gradients flashy, coins trop arrondis, animations excessives, esthétique "template générique"
- **Privilégier** : hiérarchie claire de l'information, espaces de respiration, contrastes nets
- **Images** : optimisées via next/image, ratio cohérent, alt text en français

## Accessibilité (a11y)

- Alt text sur toutes les images
- Attributs aria sur les éléments interactifs (menus, modales, overlays)
- Navigation au clavier fonctionnelle
- Contraste suffisant — attention au gold `#d4a843` sur fond clair
- Focus visible sur les éléments interactifs

## Contenu

- Tout le texte utilisateur en **français**
- Dates au format français (ex: 8 avril 2026)
- Devises : FCFA pour les prix locaux, USD/EUR si contexte international
- Ton éditorial : factuel, professionnel, accessible

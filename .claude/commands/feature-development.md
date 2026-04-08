---
name: feature-development
description: Workflow complet d'implémentation d'une feature NigerFin
allowed_tools: ["Bash", "Read", "Write", "Edit", "Grep", "Glob", "Agent"]
---

# /feature-development

Workflow standard pour implémenter une nouvelle fonctionnalité sur NigerFin.

## Étapes

### 1. Comprendre
- Lire `CLAUDE.md` et les docs pertinentes dans `docs/`
- Identifier les routes, composants et API endpoints concernés
- Vérifier les patterns existants similaires dans le codebase

### 2. Planifier
- Lister les fichiers à créer/modifier
- Identifier les dépendances et impacts sur le code existant
- Signaler tout élément proactif (SEO, a11y, perf) — attendre validation

### 3. Implémenter
- Écrire le code en suivant les règles de `nigerfin-coding-style.md`
- Écrire les tests associés (Vitest pour unit, Playwright pour e2e si UI)
- Respecter les règles de `nigerfin-security.md`

### 4. Vérifier le responsive (obligatoire si UI)
- Mobile (< 768px) — overflow, lisibilité, interactions tactiles
- Tablette (768px – 1023px) — layouts, menus, tableaux
- Desktop (≥ 1024px) — mise en page complète

### 5. Valider (OBLIGATOIRE — condition de fin)
```bash
npm run lint     # Zéro erreur, zéro warning
npm run build    # Build production réussi
npm run test     # Tous les tests passent
```
Les 3 doivent passer sans erreur. Si échec → corriger et relancer.

### 6. Résumer
- Lister les changements effectués
- Signaler les suggestions proactives (si applicable)
- Confirmer que les 3 vérifications passent

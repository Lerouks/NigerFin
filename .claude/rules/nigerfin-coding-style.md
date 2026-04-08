---
description: "Style de code NigerFin : immutabilité, organisation, TypeScript, Next.js"
globs: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"]
alwaysApply: true
---
# Standards de code NigerFin

## Immutabilité

TOUJOURS créer de nouveaux objets, JAMAIS muter les existants :

```typescript
// MAUVAIS : mutation
function updateUser(user: User, name: string) {
  user.name = name
  return user
}

// CORRECT : immutabilité
function updateUser(user: User, name: string): User {
  return { ...user, name }
}
```

## Organisation des fichiers

- Fichiers courts : 200-400 lignes typique, 800 max
- Fonctions courtes : < 50 lignes
- Pas d'imbrication profonde : max 4 niveaux
- Organiser par feature/domaine, pas par type
- Extraire les utilitaires dans des fichiers séparés

## Imports et chemins

- Utiliser l'alias `@/` pour tous les imports internes (`@/components/`, `@/lib/`, etc.)
- Jamais de chemins relatifs profonds (`../../../`)

## Next.js / React

- **Server Components par défaut** — ajouter `'use client'` uniquement quand nécessaire
- Pas de `console.log` en production — utiliser Sentry pour les erreurs
- Composants dans `src/components/`, nommés en PascalCase
- Pages dans `src/app/`, suivre la structure de routes existante

## TypeScript

- Typer explicitement les retours de fonctions et les props de composants
- Éviter `any` — utiliser `unknown` si le type est vraiment inconnu
- Types partagés dans `src/types/`
- Validation Zod aux frontières API (routes API, formulaires)

## Gestion des erreurs

```typescript
try {
  const result = await operation()
  return result
} catch (error) {
  console.error('Contexte de l\'erreur:', error)
  throw new Error('Message utilisateur en français')
}
```

- Messages d'erreur en français pour l'UI
- Logs détaillés côté serveur (anglais ok)
- Jamais d'erreurs avalées silencieusement

## Qualité — Checklist

- [ ] Code lisible, bien nommé
- [ ] Fonctions < 50 lignes
- [ ] Fichiers < 800 lignes
- [ ] Pas de nesting > 4 niveaux
- [ ] Gestion d'erreurs appropriée
- [ ] Pas de valeurs en dur (utiliser constantes ou config)
- [ ] Pas de mutation

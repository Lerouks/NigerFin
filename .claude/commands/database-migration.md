---
name: database-migration
description: Workflow de migration Supabase pour NigerFin
allowed_tools: ["Bash", "Read", "Write", "Edit", "Grep", "Glob"]
---

# /database-migration

Workflow pour modifier le schéma de base de données Supabase sur NigerFin.

## Étapes

### 1. Analyser le schéma actuel
- Lire `docs/02-supabase-tables-schema.md` pour le schéma documenté
- Vérifier les migrations existantes dans `supabase/migrations/`
- Identifier les tables et relations impactées

### 2. Créer la migration
- Nouveau fichier : `supabase/migrations/YYYYMMDDHHMMSS_description.sql`
- Écrire le SQL (CREATE TABLE, ALTER TABLE, etc.)
- **RLS obligatoire** : ajouter les policies pour chaque nouvelle table
- Gérer les données existantes si ALTER (valeurs par défaut, backfill)

### 3. Mettre à jour les types TypeScript
- Régénérer ou mettre à jour `src/types/` si les types Supabase changent
- Vérifier que les types correspondent au nouveau schéma

### 4. Mettre à jour la documentation
- Mettre à jour `docs/02-supabase-tables-schema.md` avec les changements
- Documenter les nouvelles tables, colonnes, et policies RLS

### 5. Vérifier les impacts
- Vérifier les routes API qui utilisent les tables modifiées
- Vérifier les composants qui affichent les données concernées
- S'assurer que `createServerSupabaseClient()` et `createServiceClient()` sont utilisés correctement

### 6. Valider
```bash
npm run lint     # Zéro erreur
npm run build    # Build réussi (pas d'erreur de types)
npm run test     # Tests passent
```

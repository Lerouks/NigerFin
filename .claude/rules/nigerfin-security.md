---
description: "Sécurité NigerFin : secrets, Supabase RLS, validation, XSS, rate limiting"
alwaysApply: true
---
# Règles de sécurité NigerFin

## Checklist avant chaque commit

- [ ] Aucun secret en dur (clés Supabase, iPayMoney, Sentry DSN, Resend, PostHog, Beehiiv)
- [ ] Toutes les entrées utilisateur validées (Zod aux frontières API)
- [ ] Prévention injection SQL (requêtes Supabase paramétrées, jamais de concaténation)
- [ ] Prévention XSS (sanitiser le HTML, surtout les sorties TipTap/RichTextEditor)
- [ ] Authentification/autorisation vérifiée (middleware Supabase + access-control.ts)
- [ ] Rate limiting actif sur les endpoints sensibles (src/lib/rate-limit.ts)
- [ ] Les messages d'erreur ne fuient pas de données sensibles (pas de stack traces, pas de détails DB)

## Gestion des secrets

- TOUJOURS utiliser les variables d'environnement (`.env.local`, Vercel env vars)
- JAMAIS de secrets dans le code source, les logs, ou les messages d'erreur
- Vérifier que les secrets requis sont présents au démarrage
- Fichiers sensibles : `.env*`, `credentials*`, `*.key`, `*.pem` → JAMAIS commités

## Supabase — Sécurité spécifique

- **RLS obligatoire** sur chaque nouvelle table — pas d'exception
- Utiliser `createServerSupabaseClient()` pour les routes API (avec cookies)
- Utiliser `createServiceClient()` UNIQUEMENT pour les opérations admin (service role key)
- Ne JAMAIS exposer la service role key côté client
- Vérifier les policies RLS existantes avant de modifier des tables

## Paiements (iPayMoney)

- Valider les webhooks côté serveur (vérifier la signature)
- Ne jamais faire confiance aux données envoyées par le client pour le montant/statut
- Logger les transactions pour audit (src/lib/audit.ts)

## Protocole en cas de problème de sécurité

1. STOP immédiat — ne pas continuer le travail en cours
2. Identifier et corriger le problème CRITIQUE
3. Vérifier si le même pattern existe ailleurs dans le codebase
4. Signaler à l'utilisateur avec explication claire

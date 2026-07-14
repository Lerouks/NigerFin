# TODOS Sécurité NFI Report

Liste des actions sécurité en attente, identifiées par audits successifs.

---

## ✅ RÉSOLU (2026-07-14), iPayMoney callback : vérification serveur-à-serveur

### iPayMoney callback sans signature verification

**Fichier** : `src/app/api/ipaymoney/callback/route.ts` (POST handler) + `src/lib/ipaymoney.ts`
**Identifié** : audit /cso du 2026-04-27
**Résolu** : 2026-07-14, dès obtention des clés API iPay (sandbox)
**Risque (avant correctif)** : CRITIQUE une fois en production avec des paiements réels

**Correctif livré** :
- Le callback ne fait plus confiance au statut envoyé par le webhook. Avant toute
  activation, il reconfirme le paiement directement auprès d'iPay via
  `GET https://i-pay.money/api/v1/payments/{reference}` (header `Authorization: Bearer
  IPAYMONEY_SECRET_KEY`) — helper `verifyIPayPayment()` dans `src/lib/ipaymoney.ts`.
  C'est la « Couche 2 » décrite plus bas, la plus robuste : un attaquant qui forge
  un webhook ne peut plus activer un Premium, iPay renverra un statut ≠ `succeeded`.
- Le vrai format iPay est géré : corps `{ data: { external_reference, reference,
  status } }`, statut `succeeded`/`failed`, header d'authenticité `x-iPayMoney-secret`.
- Le montant est re-validé contre le pricing canonique avant activation (anti-tampering).
- Environnement `sandbox`/`live` dynamique (fini le « live » forcé en dur).
- Tests : `src/__tests__/ipaymoney-callback.test.ts`.

**Reste avant lancement public (non bloquant côté code)** : validation du KYC iPay,
configuration du webhook (URL + secret) dans le dashboard iPay, et rotation des clés
au passage en `live`.

**Le problème (archive)** : le endpoint POST acceptait n'importe quelle requête contenant un `transaction_id` et `status: "success"` sans vérifier la signature ni confirmer auprès des serveurs iPayMoney que le paiement a vraiment été reçu. Un attaquant authentifié pouvait activer un Premium sans payer.

**Scénario d'exploit** :
1. User auth fait `POST /api/ipaymoney/checkout` → reçoit un `transactionId` au format `NFI-XXXXXXXXXXXX`
2. Sans payer, le user envoie `POST /api/ipaymoney/callback` avec `{transaction_id: "NFI-XXX...", status: "success"}`
3. Le serveur active l'abonnement Premium gratuitement

**Fix à implémenter dès réception de l'API iPayMoney** :

**Couche 1, vérification HMAC** (si iPayMoney envoie une signature) :
```typescript
import crypto from 'crypto';

// Au début du POST handler
const signature = request.headers.get('x-ipaymoney-signature');
const rawBody = await request.text();
const expectedSig = crypto
  .createHmac('sha256', process.env.IPAYMONEY_WEBHOOK_SECRET!)
  .update(rawBody)
  .digest('hex');

if (!signature || signature !== expectedSig) {
  Sentry.captureMessage('iPayMoney callback signature mismatch', { level: 'warning' });
  return NextResponse.json({ error: 'Signature invalide' }, { status: 401 });
}
```

**Couche 2, vérification serveur-vers-serveur** (LA solution la plus robuste, à activer même si Couche 1 est faite) :
```typescript
// Avant d'appeler activateSubscription()
const verifyRes = await fetch(`https://api.ipaymoney.com/v1/transactions/${transactionId}`, {
  headers: { Authorization: `Bearer ${process.env.IPAYMONEY_SECRET_KEY}` }
});
const verified = await verifyRes.json();

if (verified.status !== 'success' || verified.amount !== paymentRequest.amount) {
  await logAuditEvent('system', 'ipaymoney_callback_verification_failed', 'payment', paymentRequest.id, {
    claimed_status: status,
    actual_status: verified.status,
    claimed_amount: paymentRequest.amount,
    actual_amount: verified.amount,
  });
  return NextResponse.json({ error: 'Vérification échouée' }, { status: 403 });
}
```

**Variables d'environnement à ajouter** :
- `IPAYMONEY_WEBHOOK_SECRET` (pour HMAC)
- `IPAYMONEY_SECRET_KEY` (pour appel serveur-vers-serveur, distinct de `NEXT_PUBLIC_IPAYMONEY_PUBLIC_KEY`)
- Mettre les deux dans Vercel env vars (pas dans le repo)

**Tests à écrire** :
- Test unitaire : POST sans signature → 401
- Test unitaire : POST avec signature invalide → 401
- Test unitaire : POST avec signature OK mais transaction non vérifiée par iPayMoney → 403
- Test unitaire : POST avec signature OK + transaction vérifiée → 200 + activation
- Test e2e Playwright : flow complet checkout → paiement réel sandbox iPayMoney → activation

**Statut final (2026-07-14)** : ✅ Couche 2 (vérification serveur-à-serveur) implémentée et testée. La Couche 1 (HMAC de signature) n'est pas proposée par iPay — leur seul mécanisme d'authenticité de webhook est le header partagé `x-iPayMoney-secret`, désormais géré. La Couche 2 rend de toute façon le trou inexploitable (impossible d'activer un Premium sans un paiement réellement `succeeded` côté iPay). Le lancement public reste conditionné à la validation KYC iPay et à la configuration du webhook dans le dashboard.

---

## ⚠️ À TRAITER AVANT LE LANCEMENT LIVE, iPayMoney (audit 2026-07-14)

Corrections déjà appliquées le 2026-07-14 (callback réécrit + `src/lib/ipaymoney.ts`) :
timeout réseau sur la vérification, claim atomique anti-double-activation, gestion
d'erreur DB (500 rejouable vs 404), validation Zod de la réponse iPay, insert
`checkout` vérifié, messages FR, refacto en fonctions < 50 lignes, tests unitaires
(`ipaymoney.test.ts` + `ipaymoney-callback.test.ts`).

Restent, par ordre de priorité :

### 🔴 CRITIQUE, montant réellement encaissé non vérifié (amount tampering)

Le flux actuel utilise le SDK JS iPay (`checkout.js`) : le montant est posé en
attribut DOM `data-amount` côté client (`PaymentContent.tsx`), donc modifiable par
l'utilisateur avant paiement. L'endpoint de vérification `GET /payments/{reference}`
ne renvoie PAS de champ `amount` : impossible de comparer après coup le montant
réellement payé au prix attendu. Un utilisateur pourrait payer 100 FCFA et activer un
Premium à 50 000. Non exploitable aujourd'hui (compte en sandbox, live bloqué par le
KYC), mais BLOQUANT avant tout lancement public.

**Solutions (à trancher avec iPay)** :
1. Préféré : initier le paiement côté SERVEUR via `POST https://i-pay.money/api/v1/payments`
   (clé secrète + montant verrouillé côté serveur), au lieu du bouton SDK client. Le
   `data-amount` ne serait alors plus une source de vérité.
2. Sinon : demander à iPay un champ `amount` sur `GET /payments/{reference}` (ou un
   endpoint de transactions réglées) et comparer `verified.amount === paymentRequest.amount`
   avant activation.
3. En attendant : ne pas lancer publiquement le checkout iPay, ou mettre en revue
   manuelle tout paiement au lieu d'auto-activer.

### 🟠 Réconciliation des paiements restés `pending`

Le webhook iPay peut ne jamais arriver (la doc iPay note « l'utilisateur doit rester
sur la page »). Ajouter : (a) une colonne `ipay_reference` sur `payment_requests`,
persistée dès qu'elle est connue ; (b) un cron `reconcile-ipaymoney-pending` qui
rappelle `verifyIPayPayment` pour les lignes `pending` de plus de N minutes.

### 🟠 Atomicité transactionnelle de l'activation

Les 3 écritures d'activation (`payment_requests`, `subscriptions`, `user_profiles`)
ne sont pas dans une transaction. Le claim atomique empêche déjà la double-exécution ;
pour un état 100 % cohérent, les regrouper dans une fonction Postgres `SECURITY DEFINER`
appelée en RPC (cf. règle RPC du CLAUDE.md).

### 🟡 Dette technique, `PaymentContent.tsx` (841 lignes > 800 max du repo)

Extraire les étapes (compte / méthode / instructions / confirmation / résumé) en
composants dans `src/components/`. Pré-existant, à planifier hors du flux paiement.

---

## ⚡ Plan rotation SUPABASE_SERVICE_ROLE_KEY

**Identifié** : audit /cso du 2026-04-27 (Finding #7)

La SUPABASE_SERVICE_ROLE_KEY donne accès complet à la base (bypass RLS). Elle est stockée en plaintext dans `.env.local` sur la machine de dev et dans les variables d'env Vercel.

**Mitigations à appliquer** :
1. **Vérifier FileVault** activé sur le Mac dev. Aller dans Système → Confidentialité et sécurité → FileVault. Activer si pas déjà fait.
2. **Rotation tous les 6 mois** : prochaine rotation prévue **2026-10-27**. Procédure :
   - Aller dans le dashboard Supabase, Project Settings, API
   - Cliquer sur "Generate new service role key"
   - Mettre à jour `.env.local` localement
   - Mettre à jour Vercel env var (`vercel env rm SUPABASE_SERVICE_ROLE_KEY production`, puis `vercel env add SUPABASE_SERVICE_ROLE_KEY production`)
   - Redéployer
   - Révoquer l'ancienne clé
3. **Long terme (optionnel)** : migrer vers un secret manager type Doppler, 1Password CLI ou Infisical, qui injecte les env vars au runtime sans écrire sur disque.

---

## ⚡ CVEs restants après npm audit fix du 2026-04-27

Le `npm audit fix` non-breaking a éliminé les 2 CRITICAL (jspdf object injection, protobufjs RCE) et 5 HIGH transitives (picomatch, undici, etc.). Restent **2 HIGH + 5 MODERATE** qui nécessitent des major bumps :

### HIGH 1 : @sentry/nextjs 8.55.1 → 10.50.0 (major bump)

**Pourquoi pas tout de suite** : passage 8 → 10 implique config changes (nouveau format SDK, breaking changes sur les hooks). Codemod existant : https://github.com/getsentry/sentry-javascript/tree/master/scripts/migration

**Plan** : tenter d'abord `@sentry/nextjs@9.47.1` (intermediate), tester build + tests + e2e, puis 10.x dans une session dédiée. À planifier dans les 30 jours.

### HIGH 2 (transitive) : rollup via @sentry/nextjs

Disparaît automatiquement avec le bump Sentry ci-dessus.

### MODERATE : Next.js 15.5.15 → 16.2.4 (major bump)

**Pourquoi pas tout de suite** : Next.js 16 introduit Cache Components, PPR, breaking changes sur le routing. Le projet est stable sur 15.x. CVEs restants sur 15.x sont moderate (DoS via next/image cache, atténué par Vercel).

**Plan** : passage à Next.js 16 dans 2-3 mois quand l'écosystème (TipTap, Sentry, Supabase SSR) sera tous à jour pour 16. Utiliser `npx @next/codemod@latest upgrade latest`.

### MODERATE : exceljs 4.4.0 → version supérieure

Exceljs est utilisé en server-side pour les exports admin et market-data (CSV/XLSX). CVE moderate. Bump quand convenable.

### MODERATE : postcss, uuid (transitives)

Disparaîtront avec les bumps Sentry et Next.js.

---

## ⚡ Plan upgrade Next.js majeur (15 → 16)

**Identifié** : audit /cso du 2026-04-27

Une fois Next.js 16 stable et le projet stable sur 15.x, planifier la migration vers 16.x avec le codemod officiel `npx @next/codemod@latest upgrade latest`. Bénéfices : sécurité long terme, perfs, nouvelles features (PPR, Cache Components).

À faire quand : au moins 2 mois après la sortie stable de Next.js 16, idéalement quand un module métier nécessite une feature 16-only.

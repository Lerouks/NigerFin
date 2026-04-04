# AUTHENTIFICATION

### 21. Providers d'auth

Email/password uniquement (via supabase.auth.signInWithPassword et supabase.auth.signUp).

Pas de Google, pas de magic link, pas d'OAuth tiers. Le signup inclut un champ full_name passe dans options.data.

Le callback route (/api/auth/callback) gere l'echange de code pour confirmation d'email.

### 22. Apres l'inscription

1. Supabase envoie un email de confirmation (natif)
2. L'utilisateur clique -> redirige vers /api/auth/callback
3. Le callback :
   - Echange le code auth contre une session
   - Verifie si welcome_email_sent est false
   - Si oui : cree le profil (INSERT INTO user_profiles avec role='reader', email, full_name)
   - Envoie le welcome email via Resend (welcomeSignupEmail)
   - Met welcome_email_sent = true
4. En backup, /api/user/profile auto-cree le profil s'il n'existe pas lors du premier appel

Il n'y a PAS de trigger SQL -- la creation de profil est geree cote application.

### 23. Session client <-> serveur

- Cote client : createBrowserSupabaseClient() utilise @supabase/ssr qui gere les cookies automatiquement
- Middleware : intercepte chaque requete et appelle supabase.auth.getUser() pour rafraichir le token dans les cookies
- Cote serveur : createServerSupabaseClient() lit les cookies via next/headers pour reconstruire la session
- Le AuthContext (client) ecoute onAuthStateChange et synchronise user, session, profile


# FLUX UTILISATEUR

### 24. Flux complet d'abonnement

Via Stripe (carte bancaire) :

1. Utilisateur va sur /pricing
2. Choisit un cycle (mensuel/trimestriel/annuel) et clique "Carte bancaire"
3. Le client appelle POST /api/stripe/checkout avec { tier: 'premium', billingCycle }
4. Le serveur cree/recupere le Stripe Customer, cree une Checkout Session
5. Retourne l'URL -> l'utilisateur est redirige vers Stripe Checkout
6. Apres paiement -> redirige vers /compte?checkout=success
7. En parallele, Stripe envoie le webhook checkout.session.completed
8. Le webhook handler :
   - UPSERT subscriptions (status=active, stripe IDs, period dates)
   - UPDATE user_profiles (role=premium, subscription_status=active)
   - Sync Beehiiv
   - Envoie email de confirmation
9. Le AuthContext du client rafraichit le profil -> userRole passe a 'premium'
10. Acces immediat : aucun delai, c'est synchrone via webhook

Via mobile money (Nita/Amana) :

1. Utilisateur choisit Nita ou Amana sur /pricing
2. Effectue le transfert manuellement au numero +227 97 76 91 31
3. Soumet le numero de transaction via POST /api/payment/submit
4. La demande est stockee en status: 'pending' dans payment_requests
5. Un admin verifie via POST /api/payment/verify -> status: 'verified'
6. La verification cree la subscription + met a jour le profil + envoie email
7. Delai : depend de la verification manuelle par l'admin

### 25. Expiration / annulation

Annulation volontaire (Stripe) :
- L'utilisateur appelle DELETE /api/user/subscription
- Met cancel_at_period_end = true dans Supabase ET dans Stripe
- L'acces est maintenu jusqu'a la fin de la periode
- A l'expiration, Stripe envoie customer.subscription.deleted -> role revient a 'reader'

Expiration automatique (cron) :
- POST /api/cron/expire-subscriptions -- tourne tous les jours a 2h UTC
- Selectionne les subscriptions dont current_period_end < now() et status = 'active'
- Met a jour : subscriptions.status = 'expired', user_profiles.role = 'reader', subscription_status = 'expired'
- Envoie un email subscriptionExpiredEmail()
- Les admins gardent leur role 'admin' meme apres expiration

Warning pre-expiration :
- POST /api/cron/expiration-warning -- tourne tous les jours a 8h UTC
- Envoie subscriptionExpirationWarningEmail() 3 jours avant expiration
- Marque expiration_warning_sent = true pour eviter les doublons

### 26. Essais gratuits et codes promo

NON. Il n'y a :
- Pas de periode d'essai gratuit (free trial)
- Pas de systeme de codes promo
- Pas de coupons Stripe configures

Le seul mecanisme "gratuit" est les 3 articles premium/mois pour les readers.


# HOOKS ET UTILITAIRES

### 27. Custom hooks (src/hooks/)

| Fichier | Description |
|---------|-------------|
| useAdminCrud.ts | Hook CRUD generique pour les operations admin (fetch, create, update, delete) avec gestion loading/saving |
| useBRVMStocks.ts | Fetch des donnees boursieres BRVM via SWR (cache 30min) |
| useNigerCountry.ts | Fetch donnees pays Niger via REST Countries (cache 7 jours) |
| useNigerMacro.ts | Fetch donnees macroeconomiques (World Bank + IMF) via SWR (cache 24h) |
| usePdfExport.ts | Generation PDF stylise avec branding NFI Report (jsPDF + jspdf-autotable) |
| useRegionData.ts | Fetch donnees region ECOWAS via SWR (cache 7 jours) |
| useMarketData.ts | Fetch donnees marche avec helper groupByType (cache 5min) |

### 28. Hook dedie a la verification d'abonnement

Il n'y a PAS de hook dedie useSubscription ou useAccess. La verification se fait via le useAuth() hook expose par src/lib/auth-context.tsx :

```typescript
export function useAuth() {
  return useContext(AuthContext);
}

// Usage dans les composants :
const { isSignedIn, userRole, premiumArticlesUsed, profile } = useAuth();

// Le contexte expose :
interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isSignedIn: boolean;
  userRole: UserRole | null;       // 'reader' | 'premium' | 'admin' | null
  premiumArticlesUsed: number;     // compteur articles premium lus ce mois
  error: string | null;
  signIn, signUp, signOut, refreshProfile;
}
```

premiumArticlesUsed est fetche depuis /api/user/premium-count a chaque changement de session et expose globalement.

### 29. Fichier supabase.ts -- les 3 clients

src/lib/supabase.ts :

```typescript
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export { createBrowserSupabaseClient } from './supabase-browser';

// Server client -- pour Server Components et API routes (utilise les cookies)
export async function createServerSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch { /* Server Component context */ }
      },
    },
  });
}

// Service role client -- pour operations admin (bypass RLS)
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}
```

src/lib/supabase-browser.ts :

```typescript
import { createBrowserClient } from '@supabase/ssr';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

export function createBrowserSupabaseClient() {
  if (!isSupabaseConfigured) throw new Error('Supabase env vars not configured');
  return createBrowserClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);
}
```


# EMAIL ET COMMUNICATIONS

### 30. Emails automatiques

Tous envoyes via Resend (src/lib/email.ts) depuis noreply@nfireport.com.

| Email | Trigger | Template |
|-------|---------|----------|
| Bienvenue inscription | Callback auth (1ere confirmation email) | welcomeSignupEmail(name) |
| Bienvenue newsletter | Inscription newsletter | newsletterWelcomeEmail() |
| Confirmation contact | Soumission formulaire contact | contactConfirmationEmail(name) |
| Notification admin contact | Soumission formulaire contact | contactNotificationEmail(name, email, subject, message) |
| Confirmation paiement (mobile money) | Admin verifie un paiement | paymentConfirmationEmail(name, tier, billingCycle, expiresAt) |
| Paiement rejete | Admin rejette un paiement | paymentRejectionEmail(name, reason?) |
| Confirmation paiement Stripe | Webhook checkout.session.completed | stripePaymentConfirmationEmail(name, billingCycle) |
| Warning expiration | Cron quotidien 8h UTC (3 jours avant) | subscriptionExpirationWarningEmail(name, expiresAt) |
| Abonnement expire | Cron quotidien 2h UTC | subscriptionExpiredEmail(name, expiresAt) |
| Premium accorde par admin | Action admin manuelle | adminPremiumGrantedEmail(name, startDate, endDate) |
| Downgrade par admin | Action admin manuelle | adminDowngradeToFreeEmail(name) |
| Mot de passe change | POST /api/user/change-password | passwordChangedEmail(name) |

Les contacts sont aussi synchronises vers Beehiiv (newsletter externe) via syncContactToBeehiiv() lors des evenements Stripe.

Crons configures dans vercel.json :

```json
{
  "crons": [
    { "path": "/api/cron/expire-subscriptions", "schedule": "0 2 * * *" },
    { "path": "/api/cron/expiration-warning", "schedule": "0 8 * * *" },
    { "path": "/api/health", "schedule": "0 6 * * *" },
    { "path": "/api/cron/reset-market-close", "schedule": "0 0 * * *" }
  ]
}
```

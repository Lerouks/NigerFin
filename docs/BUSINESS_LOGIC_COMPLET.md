# LOGIQUE METIER - NFI REPORT

## ABONNEMENTS ET PLANS

### 1. Plans d'abonnement existants

Un seul tier : Premium. Trois cycles de facturation :

| Cycle | Prix | Duree | Economie |
|-------|------|-------|----------|
| Mensuel | 5 000 FCFA | 1 mois | -- |
| Trimestriel | 13 750 FCFA | 3 mois | 1 250 FCFA |
| Annuel | 50 000 FCFA | 12 mois | 10 000 FCFA |

Le plan Premium donne acces a :
- Acces illimite a tous les articles
- Analyses et rapports complets
- Acces a tous les cours d'education financiere
- 2 newsletters exclusives par semaine (briefing lundi + bilan vendredi)
- Alertes en temps reel sur les actualites majeures
- Acces a tous les outils premium

4 methodes de paiement : Nita, Amana (mobile money manuel), Carte bancaire (via Stripe), iPayMoney (mobile money + carte).

### 2. Plan gratuit

Oui, il existe un plan gratuit implicite (tout utilisateur inscrit avec role: 'reader'). Limites :

- Visiteur non connecte : 3 articles (tous types confondus) par mois, tracke via localStorage avec reset au 1er du mois suivant.
- Utilisateur connecte (reader) : articles gratuits illimites + 3 articles premium par mois (configurable via la table paywall_config.free_articles_count).
- Newsletter mensuelle uniquement.
- Outils de base uniquement.

Le compteur premium est stocke dans la table premium_article_tracking et compte cote serveur via /api/user/premium-count.

### 3. Fichier de config pricing

Fichier : src/config/pricing.ts

```typescript
export const CURRENCY = 'FCFA';

export type BillingCycle = 'monthly' | 'quarterly' | 'yearly';

export interface BillingOption {
  cycle: BillingCycle;
  price: number;
  label: string;
  durationLabel: string;
  durationMonths: number;
  savings?: string;
}

export const BILLING_OPTIONS: BillingOption[] = [
  {
    cycle: 'monthly',
    price: 5_000,
    label: '5 000 FCFA/mois',
    durationLabel: '1 mois',
    durationMonths: 1,
  },
  {
    cycle: 'quarterly',
    price: 13_750,
    label: '13 750 FCFA/3 mois',
    durationLabel: '3 mois',
    durationMonths: 3,
    savings: 'Economisez 1 250 FCFA',
  },
  {
    cycle: 'yearly',
    price: 50_000,
    label: '50 000 FCFA/an',
    durationLabel: '1 an',
    durationMonths: 12,
    savings: 'Economisez 10 000 FCFA',
  },
];

export const PREMIUM_MONTHLY_PRICE = 5_000;

export const PREMIUM_TIER: PremiumTier = {
  id: 'premium',
  name: 'Premium',
  price: PREMIUM_MONTHLY_PRICE,
  label: `A partir de ${PREMIUM_MONTHLY_PRICE.toLocaleString('fr-FR')} ${CURRENCY}/mois`,
  features: [
    'Acces illimite a tous les articles',
    'Analyses et rapports complets',
    'Acces a tous les cours d\'education financiere',
    '2 newsletters exclusives par semaine - briefing du lundi et bilan du vendredi',
    'Alertes en temps reel sur les actualites majeures',
    'Acces a tous les outils premium',
  ],
};

export const FREE_TIER_FEATURES = [
  'Articles gratuits illimites',
  '3 articles premium par mois',
  'Newsletter mensuelle',
  'Outils de base',
];

export type PaymentMethodId = 'nita' | 'amana' | 'card' | 'ipaymoney';

export const PAYMENT_METHODS: Record<PaymentMethodId, PaymentMethod> = {
  nita: {
    id: 'nita',
    name: 'Nita Transfert d\'Argent',
    shortName: 'Nita',
    logo: '/nita-logo.png',
    instructions: 'Effectuez votre transfert via Nita au numero ci-dessous...',
    recipientNumber: '+227 91 70 71 94',
    recipientName: 'NFI REPORT',
  },
  amana: {
    id: 'amana',
    name: 'Amana Transfert d\'Argent',
    shortName: 'Amana',
    logo: '/amana-logo.png',
    instructions: 'Effectuez votre transfert via Amana au numero ci-dessous...',
    recipientNumber: '+227 91 70 71 94',
    recipientName: 'NFI REPORT',
  },
  card: {
    id: 'card',
    name: 'Carte bancaire (Visa, Mastercard)',
    shortName: 'Carte',
    logo: '/card-logos.png',
    instructions: 'Redirige vers Stripe.',
    recipientNumber: '',
    recipientName: '',
  },
  ipaymoney: {
    id: 'ipaymoney',
    name: 'iPayMoney (Mobile Money et Carte)',
    shortName: 'iPayMoney',
    logo: '/ipaymoney-logo.png',
    instructions: 'Redirige vers iPayMoney.',
    recipientNumber: '',
    recipientName: '',
  },
};

export type PaymentStatus = 'pending' | 'verified' | 'rejected';
```
# SUPABASE - TABLES ET SCHEMA

### 4. Tables liees aux utilisateurs et abonnements

Table user_profiles (cle primaire = auth.users.id)

| Colonne | Type | Detail |
|---------|------|--------|
| id | uuid PK | FK vers auth.users(id) ON DELETE CASCADE |
| email | text NOT NULL | |
| full_name | text | |
| role | text NOT NULL | 'reader' / 'premium' / 'admin' (CHECK) |
| subscription_status | text | 'inactive' par defaut |
| subscription_start | timestamptz | |
| subscription_end | timestamptz | |
| subscription_granted_by | text | (admin qui a accorde manuellement) |
| subscription_updated_at | timestamptz | |
| blocked | boolean | default false |
| stripe_customer_id | text | |
| expiration_warning_sent | boolean | default false |
| created_at / updated_at | timestamptz | |

Table subscriptions (une ligne par utilisateur, UNIQUE sur user_id)

| Colonne | Type | Detail |
|---------|------|--------|
| id | uuid PK | |
| user_id | uuid FK UNIQUE | vers user_profiles(id) ON DELETE CASCADE |
| tier | text | default 'premium' |
| status | text | 'active' / 'cancelled' / 'expired' (CHECK) |
| billing_cycle | text | 'monthly' par defaut |
| stripe_subscription_id | text | |
| stripe_customer_id | text | |
| current_period_start | timestamptz | |
| current_period_end | timestamptz | |
| cancel_at_period_end | boolean | default false |
| price_amount | integer | default 0 |
| started_at | timestamptz | |
| expires_at | timestamptz | |
| created_at / updated_at | timestamptz | |

Table payment_requests (paiements manuels mobile money)

| Colonne | Type | Detail |
|---------|------|--------|
| id | uuid PK | |
| user_id | uuid FK | vers user_profiles(id) |
| tier | text | |
| billing_cycle | text | |
| amount | integer | |
| payment_method | text | |
| transaction_number | text | |
| status | text | 'pending' / 'verified' / 'rejected' (CHECK) |
| verified_by | uuid FK | vers user_profiles(id) (admin) |
| verified_at | timestamptz | |
| rejection_reason | text | |
| subscription_expires_at | timestamptz | |

Table premium_article_tracking : user_id, article_id, accessed_at -- suivi des articles premium lus par mois.

Relations : user_profiles.id <- subscriptions.user_id (1:1), user_profiles.id <- payment_requests.user_id (1:N).

Autres tables du schema complet (migration 00001_baseline.sql) :
- categories (id, name, slug, description)
- articles (voir question 17)
- article_likes (article_id, user_id, UNIQUE)
- comments (article_id, user_id, user_name, content, likes)
- article_access_log (user_id, article_id, is_premium, accessed_at)
- discussions (title, content, user_id, username, category)
- discussion_comments (discussion_id, user_id, username, content)
- market_data (name, symbol, type, value, change, change_percent, unit, source)
- education_categories (title, slug, icon, available, sort_order)
- education_lessons (category_id FK, title, duration, access_level, content)
- flash_banner (enabled, items jsonb)
- legal_sections (page_slug, heading, text, display_order)
- niger_presentation, niger_country_facts, niger_economic_indicators, niger_regions
- newsletter_preferences (user_id PK FK, newsletter_monthly, newsletter_weekly, alerts_news, alerts_custom, reports_pdf)
- messages_contact (full_name, email, subject, message, status, ip_address)
- paywall_config (enabled, trigger_type, scroll_percent, delay_seconds, title, message, free_articles_count)
- paywall_analytics (event_type, article_id, user_id)
- dynamic_pricing (tier, billing_cycle, amount, UNIQUE(tier, billing_cycle))
- auth_attempts (event_type, email, ip_address, user_agent)
- audit_log (admin_id, action, entity_type, entity_id, details jsonb)
- page_views (page_path, article_id, user_id, ip_address, user_agent)

### 5. Determination utilisateur premium

Combinaison de deux champs dans user_profiles :
- role = 'premium' ET subscription_status = 'active'

Le champ role est la source de verite cote application. Il est lu via /api/user/profile et expose dans le AuthContext comme userRole.

Dans src/lib/access-control.ts :
```typescript
if (userRole === 'premium') return { allowed: true };
if (userRole === 'admin') return { allowed: true };
```

### 6. Politiques RLS

Le fichier de migration 00001_baseline.sql ne contient PAS de politiques RLS explicites. Les tables sont accedees soit :
- Via le service role client (createServiceClient() avec SUPABASE_SERVICE_ROLE_KEY) qui bypass RLS (operations admin et webhooks)
- Via le server client (createServerSupabaseClient() avec anon key + cookies) pour les operations authentifiees

Les API routes font la verification d'acces manuellement (ex: requireAdmin() dans src/lib/admin-auth.ts verifie role === 'admin' via service client).

### 7. Fichier de types Supabase

Fichier : src/types/supabase.ts

```typescript
export interface Database {
  public: {
    Tables: {
      subscriptions: {
        Row: { id: string; user_id: string; tier: string; status: string; started_at: string; expires_at: string | null; created_at: string; };
        Insert: { user_id: string; tier: string; status?: string; started_at?: string; expires_at?: string | null; };
        Update: Partial<{ tier: string; status: string; expires_at: string | null; }>;
      };
      user_profiles: {
        Row: { id: string; email: string; full_name: string; role: string; stripe_customer_id: string | null; avatar_url: string | null; created_at: string; welcome_email_sent: boolean; is_blocked: boolean; };
        Insert: { id: string; email: string; full_name?: string; role?: string; stripe_customer_id?: string | null; avatar_url?: string | null; welcome_email_sent?: boolean; is_blocked?: boolean; };
        Update: Partial<{ email: string; full_name: string; role: string; stripe_customer_id: string | null; avatar_url: string | null; welcome_email_sent: boolean; is_blocked: boolean; }>;
      };
      articles: {
        Row: { id: string; title: string; slug: string; content: string; excerpt: string | null; category: string; content_type: string; author_id: string; main_image_url: string | null; published_at: string | null; created_at: string; updated_at: string; read_time: number | null; is_published: boolean; };
      };
      article_access_log: {
        Row: { id: string; user_id: string; article_id: string; is_premium: boolean; accessed_at: string; };
      };
      comments: {
        Row: { id: string; article_id: string; user_id: string; user_name: string; content: string; likes: number; created_at: string; };
      };
      payment_requests: {
        Row: { id: string; user_id: string; amount: number; billing_cycle: string; status: string; payment_method: string; phone_number: string | null; created_at: string; processed_at: string | null; processed_by: string | null; };
      };
      audit_log: {
        Row: { id: string; admin_id: string; action: string; target_user_id: string | null; details: Record<string, unknown> | null; created_at: string; };
      };
      page_views: {
        Row: { id: string; path: string; referrer: string | null; user_agent: string | null; created_at: string; };
      };
      messages_contact: {
        Row: { id: string; name: string; email: string; subject: string; message: string; status: string; created_at: string; };
      };
    };
  };
}
```

Fichier : src/types/index.ts

```typescript
export type ContentType = 'free' | 'premium';
export type UserRole = 'reader' | 'premium' | 'admin';
export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'past_due' | 'expired' | 'free';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  subscription_status: SubscriptionStatus;
  premium_articles_read_this_month: number;
  premium_articles_reset_at: string;
  subscription_start: string | null;
  subscription_end: string | null;
  subscription_granted_by: string | null;
  subscription_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  tier: 'premium';
  status: string;
  billing_cycle: 'monthly' | 'quarterly' | 'yearly';
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  price_amount: number;
  created_at: string;
  updated_at: string;
}
```
# STRIPE

### 8. Route webhook Stripe

Fichier : src/app/api/stripe/webhook/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { syncContactToBeehiiv } from '@/lib/beehiiv';
import { sendTransactionalEmail } from '@/lib/email';
import { stripePaymentConfirmationEmail } from '@/lib/email-templates';
import * as Sentry from '@sentry/nextjs';
import Stripe from 'stripe';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured');
  return new Stripe(key, { timeout: 10000 });
}

function mapTierToRole(tier: string): string {
  return tier === 'premium' ? 'premium' : 'reader';
}

export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    Sentry.captureMessage('STRIPE_WEBHOOK_SECRET is not configured', { level: 'error' });
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 503 });
  }

  const stripe = getStripe();
  const body = await request.text();
  const signature = request.headers.get('stripe-signature') || '';

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createServiceClient();
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const tier = session.metadata?.tier || 'premium';
        const billingCycle = session.metadata?.billing_cycle || 'monthly';

        if (userId && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string, { expand: ['items.data'] });
          const role = mapTierToRole(tier);
          const firstItem = subscription.items.data[0];

          // 1. Upsert subscriptions
          await supabase.from('subscriptions').upsert({
            user_id: userId,
            tier,
            status: 'active',
            stripe_subscription_id: subscription.id,
            stripe_customer_id: session.customer as string,
            billing_cycle: billingCycle,
            current_period_start: firstItem?.current_period_start ? new Date(firstItem.current_period_start * 1000).toISOString() : null,
            current_period_end: firstItem?.current_period_end ? new Date(firstItem.current_period_end * 1000).toISOString() : null,
            price_amount: firstItem?.price?.unit_amount || 0,
          }, { onConflict: 'user_id' });

          // 2. Update user_profiles
          await supabase.from('user_profiles').update({
            role,
            subscription_status: 'active',
            updated_at: new Date().toISOString(),
          }).eq('id', userId);

          // 3. Sync Beehiiv
          await syncBeehiivContact(userId, role, supabase);

          // 4. Audit log
          await supabase.from('audit_log').insert({
            admin_id: userId,
            action: 'subscription_created',
            entity_type: 'subscription',
            entity_id: subscription.id,
            details: { event_type: event.type, tier, billing_cycle: billingCycle, stripe_customer_id: session.customer },
          });

          // 5. Email de confirmation
          const { data: profile } = await supabase.from('user_profiles').select('email, full_name').eq('id', userId).single();
          if (profile?.email) {
            const confirmation = stripePaymentConfirmationEmail(profile.full_name || 'Client', billingCycle);
            await sendTransactionalEmail({ to: profile.email, ...confirmation }).catch((err) => {
              Sentry.captureException(err);
            });
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;
        const tier = subscription.metadata?.tier || 'premium';

        if (userId) {
          const status = subscription.status === 'active' ? 'active' : subscription.status === 'past_due' ? 'active' : 'cancelled';
          const role = status === 'active' ? mapTierToRole(tier) : 'reader';

          await supabase.from('subscriptions').update({
            status,
            current_period_start: /* ... */,
            current_period_end: /* ... */,
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          }).eq('user_id', userId);

          await supabase.from('user_profiles').update({
            role,
            subscription_status: status === 'active' ? 'active' : 'cancelled',
            updated_at: new Date().toISOString(),
          }).eq('id', userId);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        // Set subscription expired + profile role='reader', status='inactive' + sync Beehiiv
      }

      case 'invoice.paid':
      case 'invoice.payment_succeeded': {
        // Reactivate subscription to 'active' + update profile role/status
      }

      case 'customer.updated': {
        // Sync email/name from Stripe customer to user_profiles
      }

      case 'invoice.payment_failed': {
        // Set subscription_status = 'past_due' in user_profiles
      }

      case 'charge.dispute.created': {
        // Log dispute to audit_log + Sentry warning
      }

      case 'charge.refunded': {
        // Log refund to audit_log
      }
    }
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
```

### 9. Evenements Stripe ecoutes

| Evenement | Action |
|-----------|--------|
| checkout.session.completed | Cree/upsert subscription + met a jour profile (role=premium, status=active) + envoie email + sync Beehiiv |
| customer.subscription.updated | Sync status (active/cancelled) + met a jour role + cancel_at_period_end |
| customer.subscription.deleted | Met subscription a expired, profile a role=reader, subscription_status=inactive + sync Beehiiv |
| invoice.paid / invoice.payment_succeeded | Reactive subscription a active + met a jour profile |
| invoice.payment_failed | Met subscription_status a past_due dans user_profiles |
| customer.updated | Sync email/nom du client Stripe vers user_profiles |
| charge.dispute.created | Log dans audit_log + alerte Sentry |
| charge.refunded | Log dans audit_log |

### 10. Actions dans Supabase apres paiement Stripe confirme

Sur checkout.session.completed :

1. Table subscriptions -- UPSERT (on conflict user_id) : tier='premium', status='active', stripe_subscription_id, stripe_customer_id, billing_cycle, current_period_start/end, price_amount
2. Table user_profiles -- UPDATE : role='premium', subscription_status='active', updated_at=now()
3. Sync Beehiiv (newsletter) avec role=premium
4. Audit log : action 'subscription_created'
5. Email : stripePaymentConfirmationEmail() envoye via Resend

### 11. Stripe Customer ID -- stockage et liaison

Le stripe_customer_id est stocke dans user_profiles.stripe_customer_id et aussi duplique dans subscriptions.stripe_customer_id.

Cree a la premiere tentative de checkout (src/app/api/stripe/checkout/route.ts) :

```typescript
const { data: profile } = await supabase
  .from('user_profiles')
  .select('stripe_customer_id')
  .eq('id', user.id)
  .single();

let customerId = profile?.stripe_customer_id;

if (!customerId) {
  const customer = await stripe.customers.create(
    {
      email: user.email,
      metadata: { supabase_user_id: user.id },
    },
    { idempotencyKey: crypto.createHash('sha256').update(`create-customer:${user.id}`).digest('hex') }
  );
  customerId = customer.id;
  await supabase.from('user_profiles').update({ stripe_customer_id: customerId }).eq('id', user.id);
}
```

La liaison Stripe vers Supabase se fait via metadata.supabase_user_id injecte dans le customer, la session checkout, et la subscription.

### 12. Route Stripe Checkout

Fichier : src/app/api/stripe/checkout/route.ts

```typescript
export async function POST(request: NextRequest) {
  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  // Rate limit: 5 checkout/heure
  const rl = await checkRateLimit(`stripe-checkout:${user.id}`, 5, 60 * 60 * 1000);

  const { priceId: explicitPriceId, tier, billingCycle } = body;

  // Resolution du priceId depuis les env vars
  const priceIdMap: Record<string, string | undefined> = {
    monthly: process.env.STRIPE_PRICE_ID_MONTHLY,
    quarterly: process.env.STRIPE_PRICE_ID_QUARTERLY,
    yearly: process.env.STRIPE_PRICE_ID_YEARLY,
  };
  const priceId = explicitPriceId || priceIdMap[billingCycle];

  // Validation : seul tier 'premium' accepte
  if (tier !== 'premium') return error 400;

  // Get or create Stripe customer (voir Q11)

  // Creation session checkout
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${siteUrl}/compte?checkout=success`,
    cancel_url: `${siteUrl}/pricing?checkout=cancelled`,
    metadata: {
      supabase_user_id: user.id,
      tier,
      billing_cycle: billingCycle || 'monthly',
    },
    subscription_data: {
      metadata: {
        supabase_user_id: user.id,
        tier,
        billing_cycle: billingCycle || 'monthly',
      },
    },
  }, { idempotencyKey: checkoutIdempotencyKey });

  return NextResponse.json({ url: session.url });
}
```

Il existe aussi une route Portal (src/app/api/stripe/portal/route.ts) pour gerer l'abonnement existant via le portail Stripe.
# CONTROLE D'ACCES

### 13. Fichier access-control.ts complet

Fichier : src/lib/access-control.ts

```typescript
import type { ContentType, UserRole } from '@/types';

const VISITOR_ARTICLE_LIMIT = 3;
const DEFAULT_READER_PREMIUM_LIMIT = 3;

const VISITOR_STORAGE_KEY = 'nfi_visitor_articles';

interface VisitorArticleData {
  slugs: string[];
  resetAt: string;
}

function getVisitorData(): VisitorArticleData {
  if (typeof window === 'undefined') return { slugs: [], resetAt: '' };
  try {
    const raw = localStorage.getItem(VISITOR_STORAGE_KEY);
    if (!raw) return { slugs: [], resetAt: getNextMonthReset() };
    const data = JSON.parse(raw) as VisitorArticleData;
    if (new Date(data.resetAt) <= new Date()) {
      const fresh = { slugs: [], resetAt: getNextMonthReset() };
      localStorage.setItem(VISITOR_STORAGE_KEY, JSON.stringify(fresh));
      return fresh;
    }
    return data;
  } catch {
    return { slugs: [], resetAt: getNextMonthReset() };
  }
}

function getNextMonthReset(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1, 1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function getVisitorArticlesRead(): number {
  return getVisitorData().slugs.length;
}

export function canVisitorReadArticle(slug: string): boolean {
  const data = getVisitorData();
  if (data.slugs.includes(slug)) return true;
  return data.slugs.length < VISITOR_ARTICLE_LIMIT;
}

export function trackVisitorArticle(slug: string): void {
  if (typeof window === 'undefined') return;
  const data = getVisitorData();
  if (!data.slugs.includes(slug)) {
    data.slugs.push(slug);
    localStorage.setItem(VISITOR_STORAGE_KEY, JSON.stringify(data));
  }
}

export function getVisitorLimit(): number {
  return VISITOR_ARTICLE_LIMIT;
}

export type AccessResult =
  | { allowed: true }
  | { allowed: false; reason: 'login_required' | 'paywall_reader' | 'visitor_limit' };

export function checkArticleAccess(
  contentType: ContentType,
  userRole: UserRole | null,
  premiumArticlesReadThisMonth: number,
  articleSlug: string,
  readerPremiumLimit: number = DEFAULT_READER_PREMIUM_LIMIT
): AccessResult {
  if (!userRole) {
    if (contentType === 'free') {
      if (canVisitorReadArticle(articleSlug)) return { allowed: true };
      return { allowed: false, reason: 'visitor_limit' };
    }
    return { allowed: false, reason: 'login_required' };
  }
  if (userRole === 'admin') return { allowed: true };
  if (contentType === 'free') return { allowed: true };
  if (contentType === 'premium') {
    if (userRole === 'premium') return { allowed: true };
    if (premiumArticlesReadThisMonth < readerPremiumLimit) return { allowed: true };
    return { allowed: false, reason: 'paywall_reader' };
  }
  return { allowed: true };
}

export function canAccessTool(userRole: UserRole | null, isPremiumTool: boolean): boolean {
  if (!isPremiumTool) return true;
  if (!userRole) return false;
  return userRole === 'premium' || userRole === 'admin';
}

export function getReaderPremiumLimit(configuredLimit?: number): number {
  return configuredLimit ?? DEFAULT_READER_PREMIUM_LIMIT;
}
```

### 14. Middleware

Fichier : src/middleware.ts

Le middleware ne fait PAS de redirections ni de protection de routes. Il sert uniquement a rafraichir le token Supabase sur chaque requete :

```typescript
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.next();

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  try { await supabase.auth.getUser(); } catch { /* non-critical */ }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
```

### 15. Routes protegees

Il n'y a PAS de protection cote middleware. La protection se fait :

1. Cote API (serveur) : chaque route API verifie supabase.auth.getUser() et renvoie 401 si non authentifie. Les routes admin utilisent requireAdmin() de src/lib/admin-auth.ts.
2. Cote client : le AuthContext expose isSignedIn et userRole. Les composants comme PremiumOverlay verifient le role et affichent le paywall.
3. Outils premium : verifies via canAccessTool(userRole, isPremiumTool).

### 16. PremiumOverlay.tsx

Fichier : src/components/PremiumOverlay.tsx (529 lignes)

Le composant gere 6 cas d'overlay selon l'etat de l'utilisateur :

| Cas | Condition | Comportement |
|-----|-----------|-------------|
| not_connected | Pas connecte + article premium | Bloquant a 30% scroll. Champ email + CTA login/inscription |
| connected_has_articles | Reader + articles premium restants | Non-bloquant a 40% scroll. Compteur "Il vous reste X articles" + CTA continuer |
| connected_no_articles | Reader + 0 articles restants | Bloquant a 30% scroll. CTA vers pricing |
| reader_has_articles | Reader avec articles restants | Non-bloquant a 40% scroll. Compteur + CTA |
| reader_no_articles | Reader + limite atteinte | Bloquant a 30% scroll. CTA vers pricing |
| premium / admin | Premium ou Admin | Aucun overlay (retourne null) |

Fonctionnalites techniques :
- Trigger au scroll (configurable via paywall_config.scroll_percent)
- Focus trap + gestion clavier (Escape, Tab)
- Dismiss tracke en localStorage (4h cooldown pour non-bloquant)
- Analytics envoyees a /api/paywall/analytics (view, dismiss, click, continue_reading)
- Session ID via sessionStorage + crypto.randomUUID()
- Limite configurable dynamiquement via /api/paywall-config


# CONTENU ET ARTICLES

### 17. Structure d'un article dans Supabase

Table articles :

| Colonne | Type | Detail |
|---------|------|--------|
| id | uuid PK | |
| title | text NOT NULL | |
| subtitle | text | |
| slug | text NOT NULL UNIQUE | |
| excerpt | text | |
| category | text | |
| sections | text[] | default '{}' |
| content_type | text NOT NULL | 'free' ou 'premium' (CHECK) |
| is_featured | boolean | default false |
| featured_order | integer | |
| author_name | text | |
| author_avatar | text | |
| main_image_url | text | |
| main_image_alt | text | |
| main_image_caption | text | |
| body | text | Contenu complet de l'article |
| read_time | integer | En minutes |
| tags | text[] | default '{}' |
| seo_title | text | |
| seo_description | text | |
| status | text NOT NULL | 'draft' / 'published' / 'archived' (CHECK) |
| published_at | timestamptz | |
| created_at / updated_at | timestamptz | |

### 18. Distinction article gratuit vs premium

Le champ content_type dans la table articles : valeur 'free' ou 'premium'.

```typescript
export function getContentTypeFromArticle(article: { isPremium?: boolean; contentType?: ContentType }): ContentType {
  if (article.contentType) return article.contentType;
  return article.isPremium ? 'premium' : 'free';
}
```

### 19. Troncature / blocage du contenu

Le blocage est COTE CLIENT UNIQUEMENT via PremiumOverlay :

1. L'article complet est charge (le body est envoye au client)
2. Le PremiumOverlay se superpose a 30-40% du scroll selon le cas
3. En mode bloquant : document.body.style.overflow = 'hidden' + backdrop noir empeche le scroll
4. En mode non-bloquant : l'overlay est dismissable et l'utilisateur peut continuer

Il n'y a PAS de troncature cote serveur -- le contenu complet transite dans la reponse. La protection repose sur l'overlay CSS/JS.

### 20. Categories et regles d'acces differentes

Les categories (economie, finance, marches, niger, education, entreprises) sont des sections de navigation, pas des regles d'acces. Chaque article a son propre content_type independamment de sa categorie.

Il n'y a PAS de regle d'acces par categorie. L'acces depend uniquement de content_type (free/premium) x userRole (reader/premium/admin).

Exception : les outils (/outils) ont leur propre flag isPremiumTool verifie via canAccessTool().
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
2. Effectue le transfert manuellement au numero +227 91 70 71 94
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

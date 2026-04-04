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

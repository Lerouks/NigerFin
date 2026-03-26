-- Baseline migration: documents all known tables as of 2026-03-26
-- This migration is for documentation and new environment setup only.
-- It does NOT run against the existing production database.

-- ─── Auth-linked profiles ─────────────────────────────────────────────────────

create table if not exists user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'reader' check (role in ('reader', 'premium', 'admin')),
  subscription_status text default 'inactive',
  subscription_start timestamptz,
  subscription_end timestamptz,
  subscription_granted_by text,
  subscription_updated_at timestamptz,
  blocked boolean not null default false,
  stripe_customer_id text,
  expiration_warning_sent boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Subscriptions ────────────────────────────────────────────────────────────

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles(id) on delete cascade unique,
  tier text not null default 'premium',
  status text not null default 'active' check (status in ('active', 'cancelled', 'expired')),
  billing_cycle text default 'monthly',
  stripe_subscription_id text,
  stripe_customer_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  price_amount integer default 0,
  started_at timestamptz default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Payment requests (mobile money / manual) ────────────────────────────────

create table if not exists payment_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles(id) on delete cascade,
  tier text not null,
  billing_cycle text not null,
  amount integer not null,
  payment_method text not null,
  transaction_number text not null,
  status text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
  verified_by uuid references user_profiles(id),
  verified_at timestamptz,
  rejection_reason text,
  subscription_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Articles ─────────────────────────────────────────────────────────────────

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  slug text not null unique,
  excerpt text,
  category text,
  sections text[] default '{}',
  content_type text not null default 'free' check (content_type in ('free', 'premium')),
  is_featured boolean default false,
  featured_order integer,
  author_name text,
  author_avatar text,
  main_image_url text,
  main_image_alt text,
  main_image_caption text,
  body text,
  read_time integer,
  tags text[] default '{}',
  seo_title text,
  seo_description text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Article engagement ───────────────────────────────────────────────────────

create table if not exists article_likes (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references articles(id) on delete cascade,
  user_id uuid not null references user_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(article_id, user_id)
);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references articles(id) on delete cascade,
  user_id uuid not null references user_profiles(id) on delete cascade,
  user_name text not null,
  content text not null,
  likes integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists article_access_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  article_id uuid not null,
  is_premium boolean not null default false,
  accessed_at timestamptz not null default now()
);

create table if not exists premium_article_tracking (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  article_id uuid not null,
  accessed_at timestamptz not null default now()
);

-- ─── Discussions ──────────────────────────────────────────────────────────────

create table if not exists discussions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text,
  user_id uuid not null references user_profiles(id) on delete cascade,
  username text,
  category text,
  created_at timestamptz not null default now()
);

create table if not exists discussion_comments (
  id uuid primary key default gen_random_uuid(),
  discussion_id uuid not null references discussions(id) on delete cascade,
  user_id uuid not null references user_profiles(id) on delete cascade,
  username text,
  content text not null,
  created_at timestamptz not null default now()
);

-- ─── Market data ──────────────────────────────────────────────────────────────

create table if not exists market_data (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  symbol text,
  type text not null check (type in ('currency', 'commodity', 'index', 'crypto')),
  value numeric not null default 0,
  change numeric default 0,
  change_percent numeric default 0,
  unit text,
  source text,
  description text,
  education_link text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Education ────────────────────────────────────────────────────────────────

create table if not exists education_categories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  icon text,
  available boolean not null default true,
  sort_order integer default 0,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists education_lessons (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references education_categories(id) on delete cascade,
  title text not null,
  duration text,
  access_level text default 'free' check (access_level in ('free', 'standard', 'premium', 'pro')),
  sort_order integer default 0,
  content text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Flash banner ─────────────────────────────────────────────────────────────

create table if not exists flash_banner (
  id uuid primary key default gen_random_uuid(),
  enabled boolean not null default false,
  items jsonb default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- ─── Legal pages ──────────────────────────────────────────────────────────────

create table if not exists legal_sections (
  id uuid primary key default gen_random_uuid(),
  page_slug text not null,
  heading text not null,
  text text not null default '',
  display_order integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Niger presentation ───────────────────────────────────────────────────────

create table if not exists niger_presentation (
  id uuid primary key default gen_random_uuid(),
  map_image_url text,
  map_image_alt text,
  intro_title text,
  intro_text text,
  updated_at timestamptz not null default now()
);

create table if not exists niger_country_facts (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  value text not null,
  display_order integer default 0,
  category text,
  is_visible boolean default true
);

create table if not exists niger_economic_indicators (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  value text not null,
  previous_value text,
  unit text,
  category text,
  display_order integer default 0,
  is_visible boolean default true
);

create table if not exists niger_regions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  capital text,
  population integer,
  area_km2 integer,
  economic_activities text[] default '{}',
  natural_resources text[] default '{}',
  security_level text,
  security_note text,
  is_visible boolean default true
);

-- ─── Newsletter & contact ─────────────────────────────────────────────────────

create table if not exists newsletter_preferences (
  user_id uuid primary key references user_profiles(id) on delete cascade,
  newsletter_monthly boolean default true,
  newsletter_weekly boolean default false,
  alerts_news boolean default false,
  alerts_custom boolean default false,
  reports_pdf boolean default false,
  updated_at timestamptz not null default now()
);

create table if not exists messages_contact (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  subject text,
  message text not null,
  status text not null default 'unread' check (status in ('unread', 'read', 'replied')),
  ip_address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Paywall ──────────────────────────────────────────────────────────────────

create table if not exists paywall_config (
  id uuid primary key default gen_random_uuid(),
  enabled boolean default false,
  trigger_type text default 'scroll',
  scroll_percent integer default 30,
  delay_seconds integer default 5,
  title text,
  message text,
  cta_primary_text text,
  cta_secondary_text text,
  free_articles_count integer default 3,
  updated_at timestamptz not null default now()
);

create table if not exists paywall_analytics (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  article_id uuid,
  user_id uuid,
  created_at timestamptz not null default now()
);

-- ─── Pricing ──────────────────────────────────────────────────────────────────

create table if not exists dynamic_pricing (
  id uuid primary key default gen_random_uuid(),
  tier text not null,
  billing_cycle text not null,
  amount integer not null,
  updated_by uuid,
  updated_at timestamptz not null default now(),
  unique(tier, billing_cycle)
);

-- ─── Auth & security ──────────────────────────────────────────────────────────

create table if not exists auth_attempts (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  email text,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ─── Analytics ────────────────────────────────────────────────────────────────

create table if not exists page_views (
  id uuid primary key default gen_random_uuid(),
  page_path text not null,
  article_id uuid,
  user_id uuid,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

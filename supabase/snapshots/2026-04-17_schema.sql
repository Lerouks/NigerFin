--
-- PostgreSQL database dump
--

\restrict 9eecedhMyyhM8aEE1M6A6vH9WfNDbW3dE3Y5e6Ggi6ccAt5gg1OOKu4ZRWnJQb8

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: cleanup_rate_limits(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cleanup_rate_limits() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  DELETE FROM rate_limits WHERE created_at < now() - interval '24 hours';
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role, subscription_status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'reader',
    'inactive'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.newsletter_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;


--
-- Name: increment_premium_count(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.increment_premium_count(p_user_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.user_profiles
  SET premium_articles_read_this_month = premium_articles_read_this_month + 1,
      updated_at = now()
  WHERE id = p_user_id;
END;
$$;


--
-- Name: reset_market_previous_close(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.reset_market_previous_close() RETURNS void
    LANGUAGE sql SECURITY DEFINER
    AS $$
  UPDATE market_data
  SET previous_close = value,
      change = 0,
      change_percent = 0,
      updated_at = now();
$$;


--
-- Name: reset_monthly_premium_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.reset_monthly_premium_count() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.user_profiles
  SET premium_articles_read_this_month = 0,
      premium_articles_reset_at = date_trunc('month', now()) + interval '1 month'
  WHERE premium_articles_reset_at <= now();
END;
$$;


--
-- Name: set_featured_article(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_featured_article(target_article_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- First, unfeature all articles
  UPDATE articles SET is_featured = false WHERE is_featured = true;
  
  -- Then feature the target article
  UPDATE articles SET is_featured = true, featured_order = 0 WHERE id = target_article_id;
END;
$$;


--
-- Name: unfeature_article(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.unfeature_article(target_article_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  UPDATE articles SET is_featured = false WHERE id = target_article_id;
END;
$$;


--
-- Name: update_articles_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_articles_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: update_market_data_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_market_data_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: api_cache; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.api_cache (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    source text NOT NULL,
    key text NOT NULL,
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    fetched_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '01:00:00'::interval) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: api_health_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.api_health_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    source text NOT NULL,
    status text NOT NULL,
    response_time_ms integer,
    error_message text,
    checked_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT api_health_log_status_check CHECK ((status = ANY (ARRAY['success'::text, 'error'::text])))
);


--
-- Name: article_access_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.article_access_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    article_slug text NOT NULL,
    accessed_at timestamp with time zone DEFAULT now()
);


--
-- Name: article_likes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.article_likes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    article_id text NOT NULL,
    user_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: articles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.articles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    subtitle text,
    slug text NOT NULL,
    excerpt text,
    category text NOT NULL,
    content_type text DEFAULT 'free'::text NOT NULL,
    is_featured boolean DEFAULT false NOT NULL,
    featured_order integer DEFAULT 0,
    author_name text DEFAULT 'NFI Report'::text NOT NULL,
    author_avatar text,
    main_image_url text,
    main_image_alt text,
    body text DEFAULT ''::text NOT NULL,
    read_time integer,
    tags text[] DEFAULT '{}'::text[],
    seo_title text,
    seo_description text,
    status text DEFAULT 'draft'::text NOT NULL,
    published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    sections text[] DEFAULT '{}'::text[],
    main_image_caption text,
    main_image_source text,
    CONSTRAINT articles_category_check CHECK ((category = ANY (ARRAY['economie'::text, 'finance'::text, 'marches'::text, 'entreprises'::text, 'education'::text, 'niger'::text]))),
    CONSTRAINT articles_content_type_check CHECK ((content_type = ANY (ARRAY['free'::text, 'premium'::text, 'pro'::text]))),
    CONSTRAINT articles_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])))
);

ALTER TABLE ONLY public.articles FORCE ROW LEVEL SECURITY;


--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    admin_id uuid NOT NULL,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id text,
    details jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: auth_attempts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auth_attempts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_type text NOT NULL,
    email text NOT NULL,
    ip_address text,
    user_agent text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: authors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.authors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    avatar_url text,
    bio text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    article_id text NOT NULL,
    user_id text NOT NULL,
    user_name text NOT NULL,
    content text NOT NULL,
    likes integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    parent_comment_id uuid
);


--
-- Name: discussion_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.discussion_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    discussion_id uuid NOT NULL,
    user_id text NOT NULL,
    username text NOT NULL,
    content text NOT NULL,
    parent_comment_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: discussions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.discussions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    user_id text NOT NULL,
    username text NOT NULL,
    category text DEFAULT 'general'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: dynamic_pricing; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dynamic_pricing (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tier text NOT NULL,
    billing_cycle text NOT NULL,
    amount integer NOT NULL,
    updated_by uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT dynamic_pricing_billing_cycle_check CHECK ((billing_cycle = 'monthly'::text)),
    CONSTRAINT dynamic_pricing_tier_check CHECK ((tier = 'premium'::text))
);


--
-- Name: education_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.education_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    icon text DEFAULT 'BookOpen'::text NOT NULL,
    available boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    description text DEFAULT ''::text
);


--
-- Name: education_lessons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.education_lessons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category_id uuid NOT NULL,
    title text NOT NULL,
    duration text DEFAULT '5 min'::text NOT NULL,
    access_level text DEFAULT 'free'::text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    content text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT education_lessons_access_level_check CHECK ((access_level = ANY (ARRAY['free'::text, 'standard'::text, 'premium'::text, 'pro'::text])))
);


--
-- Name: flash_banner; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.flash_banner (
    id integer NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    items jsonb DEFAULT '[]'::jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: flash_banner_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.flash_banner_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: flash_banner_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.flash_banner_id_seq OWNED BY public.flash_banner.id;


--
-- Name: legal_sections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.legal_sections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    page_slug text NOT NULL,
    heading text NOT NULL,
    text text NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: market_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.market_data (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    value numeric NOT NULL,
    change numeric DEFAULT 0 NOT NULL,
    change_percent numeric DEFAULT 0 NOT NULL,
    type text NOT NULL,
    symbol text NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    unit text DEFAULT ''::text,
    source text DEFAULT ''::text,
    created_at timestamp with time zone DEFAULT now(),
    description text DEFAULT ''::text,
    education_link text DEFAULT ''::text,
    previous_close numeric DEFAULT 0,
    CONSTRAINT market_data_type_check CHECK ((type = ANY (ARRAY['currency'::text, 'commodity'::text, 'index'::text, 'crypto'::text])))
);


--
-- Name: messages_contact; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages_contact (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    full_name text NOT NULL,
    email text NOT NULL,
    subject text NOT NULL,
    message text NOT NULL,
    status text DEFAULT 'unread'::text NOT NULL,
    ip_address text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT messages_contact_status_check CHECK ((status = ANY (ARRAY['unread'::text, 'read'::text, 'replied'::text])))
);


--
-- Name: newsletter_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.newsletter_preferences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    newsletter_monthly boolean DEFAULT true,
    newsletter_weekly boolean DEFAULT false,
    alerts_news boolean DEFAULT false,
    alerts_custom boolean DEFAULT false,
    reports_pdf boolean DEFAULT false,
    brevo_contact_id text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: niger_country_facts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.niger_country_facts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    fact_key text NOT NULL,
    label text NOT NULL,
    value text NOT NULL,
    icon text,
    display_order integer DEFAULT 0,
    category text DEFAULT 'general'::text,
    updated_at timestamp with time zone DEFAULT now(),
    is_visible boolean DEFAULT true NOT NULL,
    CONSTRAINT niger_country_facts_category_check CHECK ((category = ANY (ARRAY['general'::text, 'economie'::text, 'demographie'::text, 'geographie'::text])))
);


--
-- Name: niger_economic_indicators; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.niger_economic_indicators (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    indicator_key text NOT NULL,
    label text NOT NULL,
    value numeric NOT NULL,
    previous_value numeric,
    unit text DEFAULT '%'::text NOT NULL,
    category text DEFAULT 'macro'::text,
    icon text,
    display_order integer DEFAULT 0,
    updated_at timestamp with time zone DEFAULT now(),
    is_visible boolean DEFAULT true NOT NULL,
    CONSTRAINT niger_economic_indicators_category_check CHECK ((category = ANY (ARRAY['prix'::text, 'macro'::text, 'change'::text])))
);


--
-- Name: niger_indicator_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.niger_indicator_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    indicator_id uuid NOT NULL,
    date date NOT NULL,
    value numeric NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: niger_partners; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.niger_partners (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    country_code text,
    type text DEFAULT 'export'::text,
    description text,
    display_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT niger_partners_type_check CHECK ((type = ANY (ARRAY['import'::text, 'export'::text, 'investissement'::text, 'aide'::text])))
);


--
-- Name: niger_presentation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.niger_presentation (
    id integer DEFAULT 1 NOT NULL,
    map_image_url text DEFAULT ''::text,
    map_image_alt text DEFAULT 'Carte du Niger'::text,
    intro_title text DEFAULT 'Republique du Niger'::text,
    intro_text text DEFAULT 'Le Niger, situe au coeur de l''Afrique de l''Ouest, est un pays aux ressources naturelles considerables. Premiere reserve mondiale d''uranium, producteur de petrole et d''or, le Niger occupe une position strategique dans l''economie regionale et continentale.'::text,
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT niger_presentation_id_check CHECK ((id = 1))
);


--
-- Name: niger_regions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.niger_regions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    capital text NOT NULL,
    population bigint,
    area_km2 numeric,
    economic_activities text[] DEFAULT '{}'::text[],
    natural_resources text[] DEFAULT '{}'::text[],
    security_level text DEFAULT 'stable'::text,
    security_note text,
    description text,
    coordinates_x numeric,
    coordinates_y numeric,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_visible boolean DEFAULT true NOT NULL,
    CONSTRAINT niger_regions_security_level_check CHECK ((security_level = ANY (ARRAY['stable'::text, 'moderate'::text, 'elevated'::text, 'critical'::text])))
);


--
-- Name: niger_resource_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.niger_resource_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    resource_id uuid NOT NULL,
    year integer NOT NULL,
    production numeric,
    unit text,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: niger_resources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.niger_resources (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    region_id uuid,
    location_name text,
    estimated_production text,
    production_unit text,
    operating_companies text[] DEFAULT '{}'::text[],
    economic_importance text DEFAULT 'moderee'::text,
    importance_description text,
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_visible boolean DEFAULT true NOT NULL,
    CONSTRAINT niger_resources_economic_importance_check CHECK ((economic_importance = ANY (ARRAY['critique'::text, 'majeure'::text, 'moderee'::text, 'mineure'::text]))),
    CONSTRAINT niger_resources_type_check CHECK ((type = ANY (ARRAY['uranium'::text, 'petrole'::text, 'or'::text, 'charbon'::text, 'autre'::text])))
);


--
-- Name: page_views; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.page_views (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    page_path text NOT NULL,
    article_id text,
    referrer text,
    viewed_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: payment_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    tier text NOT NULL,
    billing_cycle text NOT NULL,
    amount integer NOT NULL,
    payment_method text NOT NULL,
    transaction_number text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    rejection_reason text,
    verified_by uuid,
    verified_at timestamp with time zone,
    subscription_expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT payment_requests_billing_cycle_check CHECK ((billing_cycle = ANY (ARRAY['monthly'::text, 'quarterly'::text, 'yearly'::text]))),
    CONSTRAINT payment_requests_payment_method_check CHECK ((payment_method = ANY (ARRAY['nita'::text, 'amana'::text]))),
    CONSTRAINT payment_requests_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'verified'::text, 'rejected'::text]))),
    CONSTRAINT payment_requests_tier_check CHECK ((tier = ANY (ARRAY['standard'::text, 'pro'::text])))
);


--
-- Name: paywall_analytics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.paywall_analytics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_type text NOT NULL,
    article_id text,
    user_id uuid,
    session_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    scroll_depth integer,
    read_time_seconds integer,
    overlay_case text,
    CONSTRAINT paywall_analytics_event_type_check CHECK ((event_type = ANY (ARRAY['view'::text, 'click_subscribe'::text, 'click_login'::text, 'dismiss'::text])))
);


--
-- Name: paywall_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.paywall_config (
    id integer DEFAULT 1 NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    trigger_type text DEFAULT 'scroll'::text NOT NULL,
    scroll_percent integer DEFAULT 50 NOT NULL,
    delay_seconds integer DEFAULT 3 NOT NULL,
    title text DEFAULT 'Accédez à tout le contenu NFI Report'::text NOT NULL,
    message text DEFAULT 'Abonnez-vous pour lire cet article en entier et accéder à toutes nos analyses premium.'::text NOT NULL,
    cta_subscribe_text text DEFAULT 'Abonnez-vous'::text NOT NULL,
    cta_login_text text DEFAULT 'Déjà abonné ? Connectez-vous'::text NOT NULL,
    cta_dismiss_text text DEFAULT 'Pas maintenant'::text NOT NULL,
    dismiss_cookie_hours integer DEFAULT 24 NOT NULL,
    show_article_counter boolean DEFAULT true NOT NULL,
    counter_message text DEFAULT '{remaining} articles restants avant abonnement obligatoire'::text NOT NULL,
    bg_color text DEFAULT '#111111'::text NOT NULL,
    text_color text DEFAULT '#ffffff'::text NOT NULL,
    cta_bg_color text DEFAULT '#ffffff'::text NOT NULL,
    cta_text_color text DEFAULT '#111111'::text NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT paywall_config_id_check CHECK ((id = 1)),
    CONSTRAINT paywall_config_trigger_type_check CHECK ((trigger_type = ANY (ARRAY['scroll'::text, 'time'::text, 'both'::text])))
);


--
-- Name: premium_article_tracking; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.premium_article_tracking (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    article_id text NOT NULL,
    article_slug text NOT NULL,
    read_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: rate_limits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rate_limits (
    id bigint NOT NULL,
    key text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: rate_limits_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.rate_limits ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.rate_limits_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: strategic_enterprises; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.strategic_enterprises (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    sector text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    logo_url text,
    image_url text,
    display_order integer DEFAULT 0 NOT NULL,
    is_visible boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    slug text,
    full_name text,
    founded_year integer,
    headquarters text,
    employees text,
    revenue text,
    ownership text,
    website text,
    detailed_description text,
    key_facts jsonb DEFAULT '[]'::jsonb,
    brand_color text
);


--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    tier text DEFAULT 'lecteur'::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    billing_cycle text DEFAULT 'monthly'::text,
    current_period_start timestamp with time zone,
    current_period_end timestamp with time zone,
    cancel_at_period_end boolean DEFAULT false,
    price_amount integer DEFAULT 0,
    CONSTRAINT subscriptions_billing_cycle_check CHECK ((billing_cycle = ANY (ARRAY['monthly'::text, 'quarterly'::text, 'yearly'::text]))),
    CONSTRAINT subscriptions_status_check CHECK ((status = ANY (ARRAY['active'::text, 'cancelled'::text, 'expired'::text]))),
    CONSTRAINT subscriptions_tier_check CHECK ((tier = ANY (ARRAY['lecteur'::text, 'standard'::text, 'premium'::text, 'pro'::text])))
);


--
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_profiles (
    id uuid NOT NULL,
    email text NOT NULL,
    full_name text,
    role text DEFAULT 'reader'::text NOT NULL,
    subscription_status text DEFAULT 'inactive'::text NOT NULL,
    billing_cycle text,
    premium_articles_read_this_month integer DEFAULT 0 NOT NULL,
    premium_articles_reset_at timestamp with time zone DEFAULT (date_trunc('month'::text, now()) + '1 mon'::interval),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    blocked boolean DEFAULT false,
    subscription_start timestamp with time zone,
    subscription_end timestamp with time zone,
    subscription_granted_by uuid,
    subscription_updated_at timestamp with time zone,
    expiration_warning_sent boolean DEFAULT false,
    phone text,
    civility text,
    first_name text,
    last_name text,
    birth_day integer,
    birth_month integer,
    birth_year integer,
    address text,
    city text,
    postal_code text,
    country text DEFAULT 'Niger'::text,
    profession text,
    profile_completed boolean DEFAULT false,
    newsletter_subscribed boolean DEFAULT false NOT NULL,
    CONSTRAINT user_profiles_billing_cycle_check CHECK ((billing_cycle = ANY (ARRAY['monthly'::text, 'quarterly'::text, 'yearly'::text]))),
    CONSTRAINT user_profiles_role_check CHECK ((role = ANY (ARRAY['reader'::text, 'premium'::text, 'standard'::text, 'pro'::text, 'admin'::text]))),
    CONSTRAINT user_profiles_subscription_status_check CHECK ((subscription_status = ANY (ARRAY['active'::text, 'inactive'::text, 'cancelled'::text, 'past_due'::text, 'expired'::text, 'free'::text])))
);


--
-- Name: flash_banner id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flash_banner ALTER COLUMN id SET DEFAULT nextval('public.flash_banner_id_seq'::regclass);


--
-- Name: api_cache api_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_cache
    ADD CONSTRAINT api_cache_pkey PRIMARY KEY (id);


--
-- Name: api_cache api_cache_source_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_cache
    ADD CONSTRAINT api_cache_source_key_key UNIQUE (source, key);


--
-- Name: api_health_log api_health_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_health_log
    ADD CONSTRAINT api_health_log_pkey PRIMARY KEY (id);


--
-- Name: article_access_log article_access_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_access_log
    ADD CONSTRAINT article_access_log_pkey PRIMARY KEY (id);


--
-- Name: article_likes article_likes_article_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_likes
    ADD CONSTRAINT article_likes_article_id_user_id_key UNIQUE (article_id, user_id);


--
-- Name: article_likes article_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_likes
    ADD CONSTRAINT article_likes_pkey PRIMARY KEY (id);


--
-- Name: articles articles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_pkey PRIMARY KEY (id);


--
-- Name: articles articles_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_slug_key UNIQUE (slug);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);


--
-- Name: auth_attempts auth_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_attempts
    ADD CONSTRAINT auth_attempts_pkey PRIMARY KEY (id);


--
-- Name: authors authors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.authors
    ADD CONSTRAINT authors_pkey PRIMARY KEY (id);


--
-- Name: categories categories_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key UNIQUE (name);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: categories categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_key UNIQUE (slug);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: discussion_comments discussion_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discussion_comments
    ADD CONSTRAINT discussion_comments_pkey PRIMARY KEY (id);


--
-- Name: discussions discussions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discussions
    ADD CONSTRAINT discussions_pkey PRIMARY KEY (id);


--
-- Name: dynamic_pricing dynamic_pricing_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dynamic_pricing
    ADD CONSTRAINT dynamic_pricing_pkey PRIMARY KEY (id);


--
-- Name: dynamic_pricing dynamic_pricing_tier_billing_cycle_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dynamic_pricing
    ADD CONSTRAINT dynamic_pricing_tier_billing_cycle_key UNIQUE (tier, billing_cycle);


--
-- Name: education_categories education_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.education_categories
    ADD CONSTRAINT education_categories_pkey PRIMARY KEY (id);


--
-- Name: education_categories education_categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.education_categories
    ADD CONSTRAINT education_categories_slug_key UNIQUE (slug);


--
-- Name: education_lessons education_lessons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.education_lessons
    ADD CONSTRAINT education_lessons_pkey PRIMARY KEY (id);


--
-- Name: flash_banner flash_banner_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flash_banner
    ADD CONSTRAINT flash_banner_pkey PRIMARY KEY (id);


--
-- Name: legal_sections legal_sections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legal_sections
    ADD CONSTRAINT legal_sections_pkey PRIMARY KEY (id);


--
-- Name: market_data market_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_data
    ADD CONSTRAINT market_data_pkey PRIMARY KEY (id);


--
-- Name: market_data market_data_symbol_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_data
    ADD CONSTRAINT market_data_symbol_key UNIQUE (symbol);


--
-- Name: messages_contact messages_contact_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages_contact
    ADD CONSTRAINT messages_contact_pkey PRIMARY KEY (id);


--
-- Name: newsletter_preferences newsletter_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.newsletter_preferences
    ADD CONSTRAINT newsletter_preferences_pkey PRIMARY KEY (id);


--
-- Name: newsletter_preferences newsletter_preferences_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.newsletter_preferences
    ADD CONSTRAINT newsletter_preferences_user_id_key UNIQUE (user_id);


--
-- Name: niger_country_facts niger_country_facts_fact_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.niger_country_facts
    ADD CONSTRAINT niger_country_facts_fact_key_key UNIQUE (fact_key);


--
-- Name: niger_country_facts niger_country_facts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.niger_country_facts
    ADD CONSTRAINT niger_country_facts_pkey PRIMARY KEY (id);


--
-- Name: niger_economic_indicators niger_economic_indicators_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.niger_economic_indicators
    ADD CONSTRAINT niger_economic_indicators_pkey PRIMARY KEY (id);


--
-- Name: niger_indicator_history niger_indicator_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.niger_indicator_history
    ADD CONSTRAINT niger_indicator_history_pkey PRIMARY KEY (id);


--
-- Name: niger_partners niger_partners_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.niger_partners
    ADD CONSTRAINT niger_partners_pkey PRIMARY KEY (id);


--
-- Name: niger_presentation niger_presentation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.niger_presentation
    ADD CONSTRAINT niger_presentation_pkey PRIMARY KEY (id);


--
-- Name: niger_regions niger_regions_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.niger_regions
    ADD CONSTRAINT niger_regions_name_key UNIQUE (name);


--
-- Name: niger_regions niger_regions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.niger_regions
    ADD CONSTRAINT niger_regions_pkey PRIMARY KEY (id);


--
-- Name: niger_resource_history niger_resource_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.niger_resource_history
    ADD CONSTRAINT niger_resource_history_pkey PRIMARY KEY (id);


--
-- Name: niger_resources niger_resources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.niger_resources
    ADD CONSTRAINT niger_resources_pkey PRIMARY KEY (id);


--
-- Name: page_views page_views_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_views
    ADD CONSTRAINT page_views_pkey PRIMARY KEY (id);


--
-- Name: payment_requests payment_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_requests
    ADD CONSTRAINT payment_requests_pkey PRIMARY KEY (id);


--
-- Name: paywall_analytics paywall_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paywall_analytics
    ADD CONSTRAINT paywall_analytics_pkey PRIMARY KEY (id);


--
-- Name: paywall_config paywall_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paywall_config
    ADD CONSTRAINT paywall_config_pkey PRIMARY KEY (id);


--
-- Name: premium_article_tracking premium_article_tracking_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.premium_article_tracking
    ADD CONSTRAINT premium_article_tracking_pkey PRIMARY KEY (id);


--
-- Name: premium_article_tracking premium_article_tracking_user_id_article_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.premium_article_tracking
    ADD CONSTRAINT premium_article_tracking_user_id_article_id_key UNIQUE (user_id, article_id);


--
-- Name: rate_limits rate_limits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rate_limits
    ADD CONSTRAINT rate_limits_pkey PRIMARY KEY (id);


--
-- Name: strategic_enterprises strategic_enterprises_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.strategic_enterprises
    ADD CONSTRAINT strategic_enterprises_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_user_id_key UNIQUE (user_id);


--
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);


--
-- Name: idx_access_log_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_access_log_user ON public.article_access_log USING btree (user_id);


--
-- Name: idx_api_cache_expires; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_api_cache_expires ON public.api_cache USING btree (expires_at);


--
-- Name: idx_api_cache_source; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_api_cache_source ON public.api_cache USING btree (source);


--
-- Name: idx_api_cache_source_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_api_cache_source_key ON public.api_cache USING btree (source, key);


--
-- Name: idx_api_health_checked; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_api_health_checked ON public.api_health_log USING btree (checked_at);


--
-- Name: idx_api_health_source; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_api_health_source ON public.api_health_log USING btree (source);


--
-- Name: idx_article_likes_article; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_article_likes_article ON public.article_likes USING btree (article_id);


--
-- Name: idx_article_likes_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_article_likes_user ON public.article_likes USING btree (user_id, article_id);


--
-- Name: idx_articles_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_articles_category ON public.articles USING btree (category);


--
-- Name: idx_articles_featured; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_articles_featured ON public.articles USING btree (is_featured, featured_order);


--
-- Name: idx_articles_published_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_articles_published_at ON public.articles USING btree (published_at DESC);


--
-- Name: idx_articles_sections; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_articles_sections ON public.articles USING gin (sections);


--
-- Name: idx_articles_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_articles_slug ON public.articles USING btree (slug);


--
-- Name: idx_articles_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_articles_status ON public.articles USING btree (status);


--
-- Name: idx_audit_log_admin_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_log_admin_id ON public.audit_log USING btree (admin_id);


--
-- Name: idx_audit_log_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_log_created_at ON public.audit_log USING btree (created_at DESC);


--
-- Name: idx_audit_log_entity_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_log_entity_type ON public.audit_log USING btree (entity_type);


--
-- Name: idx_auth_attempts_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auth_attempts_created_at ON public.auth_attempts USING btree (created_at DESC);


--
-- Name: idx_auth_attempts_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auth_attempts_email ON public.auth_attempts USING btree (email);


--
-- Name: idx_comments_article; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comments_article ON public.comments USING btree (article_id);


--
-- Name: idx_comments_article_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comments_article_id ON public.comments USING btree (article_id);


--
-- Name: idx_comments_parent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comments_parent ON public.comments USING btree (parent_comment_id);


--
-- Name: idx_comments_parent_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comments_parent_id ON public.comments USING btree (parent_comment_id);


--
-- Name: idx_discussion_comments_discussion; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_discussion_comments_discussion ON public.discussion_comments USING btree (discussion_id);


--
-- Name: idx_discussion_comments_parent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_discussion_comments_parent ON public.discussion_comments USING btree (parent_comment_id);


--
-- Name: idx_discussions_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_discussions_category ON public.discussions USING btree (category);


--
-- Name: idx_discussions_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_discussions_created ON public.discussions USING btree (created_at DESC);


--
-- Name: idx_legal_sections_page_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_legal_sections_page_slug ON public.legal_sections USING btree (page_slug, display_order);


--
-- Name: idx_messages_contact_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_contact_created ON public.messages_contact USING btree (created_at DESC);


--
-- Name: idx_messages_contact_ip; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_contact_ip ON public.messages_contact USING btree (ip_address, created_at);


--
-- Name: idx_messages_contact_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_contact_status ON public.messages_contact USING btree (status);


--
-- Name: idx_page_views_article_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_page_views_article_id ON public.page_views USING btree (article_id) WHERE (article_id IS NOT NULL);


--
-- Name: idx_page_views_page_path; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_page_views_page_path ON public.page_views USING btree (page_path);


--
-- Name: idx_page_views_viewed_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_page_views_viewed_at ON public.page_views USING btree (viewed_at DESC);


--
-- Name: idx_paywall_analytics_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_paywall_analytics_created_at ON public.paywall_analytics USING btree (created_at DESC);


--
-- Name: idx_paywall_analytics_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_paywall_analytics_date ON public.paywall_analytics USING btree (created_at);


--
-- Name: idx_paywall_analytics_event; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_paywall_analytics_event ON public.paywall_analytics USING btree (event_type, created_at);


--
-- Name: idx_paywall_analytics_overlay_case; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_paywall_analytics_overlay_case ON public.paywall_analytics USING btree (overlay_case) WHERE (overlay_case IS NOT NULL);


--
-- Name: idx_premium_tracking_user_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_premium_tracking_user_date ON public.premium_article_tracking USING btree (user_id, read_at DESC);


--
-- Name: idx_rate_limits_key_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rate_limits_key_created ON public.rate_limits USING btree (key, created_at DESC);


--
-- Name: idx_subscriptions_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscriptions_user ON public.subscriptions USING btree (user_id);


--
-- Name: idx_user_profiles_subscription_end; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_profiles_subscription_end ON public.user_profiles USING btree (subscription_end) WHERE ((subscription_status = 'active'::text) AND (subscription_end IS NOT NULL));


--
-- Name: payment_requests_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payment_requests_status_idx ON public.payment_requests USING btree (status);


--
-- Name: payment_requests_txn_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX payment_requests_txn_unique ON public.payment_requests USING btree (payment_method, transaction_number);


--
-- Name: payment_requests_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payment_requests_user_id_idx ON public.payment_requests USING btree (user_id);


--
-- Name: strategic_enterprises_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX strategic_enterprises_slug_key ON public.strategic_enterprises USING btree (slug);


--
-- Name: articles articles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER articles_updated_at BEFORE UPDATE ON public.articles FOR EACH ROW EXECUTE FUNCTION public.update_articles_updated_at();


--
-- Name: market_data trg_market_data_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_market_data_updated_at BEFORE UPDATE ON public.market_data FOR EACH ROW EXECUTE FUNCTION public.update_market_data_timestamp();


--
-- Name: audit_log audit_log_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES auth.users(id);


--
-- Name: audit_log audit_log_admin_profile_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_admin_profile_fkey FOREIGN KEY (admin_id) REFERENCES public.user_profiles(id);


--
-- Name: discussion_comments discussion_comments_discussion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discussion_comments
    ADD CONSTRAINT discussion_comments_discussion_id_fkey FOREIGN KEY (discussion_id) REFERENCES public.discussions(id) ON DELETE CASCADE;


--
-- Name: dynamic_pricing dynamic_pricing_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dynamic_pricing
    ADD CONSTRAINT dynamic_pricing_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: education_lessons education_lessons_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.education_lessons
    ADD CONSTRAINT education_lessons_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.education_categories(id) ON DELETE CASCADE;


--
-- Name: comments fk_parent_comment; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT fk_parent_comment FOREIGN KEY (parent_comment_id) REFERENCES public.comments(id) ON DELETE CASCADE;


--
-- Name: newsletter_preferences newsletter_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.newsletter_preferences
    ADD CONSTRAINT newsletter_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: niger_indicator_history niger_indicator_history_indicator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.niger_indicator_history
    ADD CONSTRAINT niger_indicator_history_indicator_id_fkey FOREIGN KEY (indicator_id) REFERENCES public.niger_economic_indicators(id) ON DELETE CASCADE;


--
-- Name: niger_resource_history niger_resource_history_resource_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.niger_resource_history
    ADD CONSTRAINT niger_resource_history_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES public.niger_resources(id) ON DELETE CASCADE;


--
-- Name: niger_resources niger_resources_region_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.niger_resources
    ADD CONSTRAINT niger_resources_region_id_fkey FOREIGN KEY (region_id) REFERENCES public.niger_regions(id) ON DELETE SET NULL;


--
-- Name: payment_requests payment_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_requests
    ADD CONSTRAINT payment_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: payment_requests payment_requests_user_profile_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_requests
    ADD CONSTRAINT payment_requests_user_profile_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id);


--
-- Name: payment_requests payment_requests_verified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_requests
    ADD CONSTRAINT payment_requests_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES auth.users(id);


--
-- Name: premium_article_tracking premium_article_tracking_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.premium_article_tracking
    ADD CONSTRAINT premium_article_tracking_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_profiles user_profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_profiles user_profiles_subscription_granted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_subscription_granted_by_fkey FOREIGN KEY (subscription_granted_by) REFERENCES auth.users(id);


--
-- Name: niger_presentation Admin can update niger_presentation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can update niger_presentation" ON public.niger_presentation FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.role = 'admin'::text))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.role = 'admin'::text)))));


--
-- Name: niger_country_facts Admin manage niger_country_facts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin manage niger_country_facts" ON public.niger_country_facts USING ((EXISTS ( SELECT 1
   FROM public.user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.role = 'admin'::text)))));


--
-- Name: niger_economic_indicators Admin manage niger_economic_indicators; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin manage niger_economic_indicators" ON public.niger_economic_indicators USING ((EXISTS ( SELECT 1
   FROM public.user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.role = 'admin'::text)))));


--
-- Name: niger_indicator_history Admin manage niger_indicator_history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin manage niger_indicator_history" ON public.niger_indicator_history USING ((EXISTS ( SELECT 1
   FROM public.user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.role = 'admin'::text)))));


--
-- Name: niger_partners Admin manage niger_partners; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin manage niger_partners" ON public.niger_partners USING ((EXISTS ( SELECT 1
   FROM public.user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.role = 'admin'::text)))));


--
-- Name: niger_regions Admin manage niger_regions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin manage niger_regions" ON public.niger_regions USING ((EXISTS ( SELECT 1
   FROM public.user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.role = 'admin'::text)))));


--
-- Name: niger_resource_history Admin manage niger_resource_history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin manage niger_resource_history" ON public.niger_resource_history USING ((EXISTS ( SELECT 1
   FROM public.user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.role = 'admin'::text)))));


--
-- Name: niger_resources Admin manage niger_resources; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin manage niger_resources" ON public.niger_resources USING ((EXISTS ( SELECT 1
   FROM public.user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.role = 'admin'::text)))));


--
-- Name: paywall_analytics Admin read paywall_analytics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin read paywall_analytics" ON public.paywall_analytics FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.role = 'admin'::text)))));


--
-- Name: paywall_config Admin read paywall_config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin read paywall_config" ON public.paywall_config FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.role = 'admin'::text)))));


--
-- Name: paywall_config Admin update paywall_config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin update paywall_config" ON public.paywall_config FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.role = 'admin'::text)))));


--
-- Name: article_likes Anyone can read article_likes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read article_likes" ON public.article_likes FOR SELECT USING (true);


--
-- Name: authors Anyone can read authors; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read authors" ON public.authors FOR SELECT USING (true);


--
-- Name: categories Anyone can read categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read categories" ON public.categories FOR SELECT USING (true);


--
-- Name: comments Anyone can read comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read comments" ON public.comments FOR SELECT USING (true);


--
-- Name: discussion_comments Anyone can read discussion_comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read discussion_comments" ON public.discussion_comments FOR SELECT USING (true);


--
-- Name: discussions Anyone can read discussions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read discussions" ON public.discussions FOR SELECT USING (true);


--
-- Name: market_data Anyone can read market_data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read market_data" ON public.market_data FOR SELECT USING (true);


--
-- Name: niger_presentation Anyone can read niger_presentation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read niger_presentation" ON public.niger_presentation FOR SELECT USING (true);


--
-- Name: dynamic_pricing Anyone can read prices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read prices" ON public.dynamic_pricing FOR SELECT USING (true);


--
-- Name: articles Anyone can read published articles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read published articles" ON public.articles FOR SELECT USING ((status = 'published'::text));


--
-- Name: discussion_comments Auth users can create discussion_comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Auth users can create discussion_comments" ON public.discussion_comments FOR INSERT TO authenticated WITH CHECK (((auth.uid())::text = user_id));


--
-- Name: discussions Auth users can create discussions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Auth users can create discussions" ON public.discussions FOR INSERT TO authenticated WITH CHECK (((auth.uid())::text = user_id));


--
-- Name: article_likes Auth users can insert article_likes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Auth users can insert article_likes" ON public.article_likes FOR INSERT TO authenticated WITH CHECK (((auth.uid())::text = user_id));


--
-- Name: comments Authenticated users can insert comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can insert comments" ON public.comments FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: paywall_analytics Insert paywall_analytics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Insert paywall_analytics" ON public.paywall_analytics FOR INSERT TO authenticated, anon WITH CHECK (true);


--
-- Name: strategic_enterprises Public read access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read access" ON public.strategic_enterprises FOR SELECT USING (true);


--
-- Name: education_categories Public read education_categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read education_categories" ON public.education_categories FOR SELECT USING (true);


--
-- Name: education_lessons Public read education_lessons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read education_lessons" ON public.education_lessons FOR SELECT USING (true);


--
-- Name: flash_banner Public read flash_banner; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read flash_banner" ON public.flash_banner FOR SELECT USING (true);


--
-- Name: niger_country_facts Public read niger_country_facts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read niger_country_facts" ON public.niger_country_facts FOR SELECT USING (true);


--
-- Name: niger_economic_indicators Public read niger_economic_indicators; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read niger_economic_indicators" ON public.niger_economic_indicators FOR SELECT USING (true);


--
-- Name: niger_indicator_history Public read niger_indicator_history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read niger_indicator_history" ON public.niger_indicator_history FOR SELECT USING (true);


--
-- Name: niger_partners Public read niger_partners; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read niger_partners" ON public.niger_partners FOR SELECT USING (true);


--
-- Name: niger_regions Public read niger_regions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read niger_regions" ON public.niger_regions FOR SELECT USING (true);


--
-- Name: niger_resource_history Public read niger_resource_history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read niger_resource_history" ON public.niger_resource_history FOR SELECT USING (true);


--
-- Name: niger_resources Public read niger_resources; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read niger_resources" ON public.niger_resources FOR SELECT USING (true);


--
-- Name: paywall_config Public read paywall_config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read paywall_config" ON public.paywall_config FOR SELECT TO anon USING (true);


--
-- Name: payment_requests Service role can manage all payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can manage all payments" ON public.payment_requests USING ((auth.role() = 'service_role'::text));


--
-- Name: user_profiles Service role can manage all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can manage all profiles" ON public.user_profiles USING ((auth.role() = 'service_role'::text));


--
-- Name: audit_log Service role full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access" ON public.audit_log USING ((auth.role() = 'service_role'::text));


--
-- Name: dynamic_pricing Service role full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access" ON public.dynamic_pricing USING ((auth.role() = 'service_role'::text));


--
-- Name: page_views Service role full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access" ON public.page_views USING (true) WITH CHECK (true);


--
-- Name: strategic_enterprises Service role full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access" ON public.strategic_enterprises USING ((auth.role() = 'service_role'::text));


--
-- Name: subscriptions Service role full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access" ON public.subscriptions USING ((auth.role() = 'service_role'::text));


--
-- Name: article_access_log Service role full access article_access_log; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access article_access_log" ON public.article_access_log USING ((auth.role() = 'service_role'::text));


--
-- Name: education_categories Service role full access education_categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access education_categories" ON public.education_categories USING ((auth.role() = 'service_role'::text));


--
-- Name: education_lessons Service role full access education_lessons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access education_lessons" ON public.education_lessons USING ((auth.role() = 'service_role'::text));


--
-- Name: flash_banner Service role full access flash_banner; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access flash_banner" ON public.flash_banner USING ((auth.role() = 'service_role'::text));


--
-- Name: legal_sections Service role full access legal_sections; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access legal_sections" ON public.legal_sections USING ((auth.role() = 'service_role'::text));


--
-- Name: market_data Service role full access market_data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access market_data" ON public.market_data USING ((auth.role() = 'service_role'::text));


--
-- Name: niger_presentation Service role full access niger_presentation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access niger_presentation" ON public.niger_presentation USING ((auth.role() = 'service_role'::text));


--
-- Name: api_cache Service role full access on api_cache; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access on api_cache" ON public.api_cache USING (true) WITH CHECK (true);


--
-- Name: api_health_log Service role full access on api_health_log; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access on api_health_log" ON public.api_health_log USING (true) WITH CHECK (true);


--
-- Name: articles Service role manages articles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role manages articles" ON public.articles TO service_role USING (true) WITH CHECK (true);


--
-- Name: authors Service role manages authors; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role manages authors" ON public.authors TO service_role USING (true) WITH CHECK (true);


--
-- Name: categories Service role manages categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role manages categories" ON public.categories TO service_role USING (true) WITH CHECK (true);


--
-- Name: auth_attempts Service role only; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role only" ON public.auth_attempts USING ((auth.role() = 'service_role'::text));


--
-- Name: payment_requests Users can create own payment requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own payment requests" ON public.payment_requests FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: article_likes Users can delete own article_likes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own article_likes" ON public.article_likes FOR DELETE TO authenticated USING (((auth.uid())::text = user_id));


--
-- Name: comments Users can delete own comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE TO authenticated USING (((auth.uid())::text = user_id));


--
-- Name: discussion_comments Users can delete own discussion_comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own discussion_comments" ON public.discussion_comments FOR DELETE TO authenticated USING (((auth.uid())::text = user_id));


--
-- Name: discussions Users can delete own discussions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own discussions" ON public.discussions FOR DELETE TO authenticated USING (((auth.uid())::text = user_id));


--
-- Name: article_access_log Users can insert own access log; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own access log" ON public.article_access_log FOR INSERT WITH CHECK (((auth.uid())::text = user_id));


--
-- Name: newsletter_preferences Users can insert own newsletter prefs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own newsletter prefs" ON public.newsletter_preferences FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: premium_article_tracking Users can insert own tracking; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own tracking" ON public.premium_article_tracking FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: article_access_log Users can read own access log; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read own access log" ON public.article_access_log FOR SELECT USING (((auth.uid())::text = user_id));


--
-- Name: newsletter_preferences Users can read own newsletter prefs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read own newsletter prefs" ON public.newsletter_preferences FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_profiles Users can read own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read own profile" ON public.user_profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: subscriptions Users can read own subscription; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read own subscription" ON public.subscriptions FOR SELECT USING (((auth.uid())::text = user_id));


--
-- Name: premium_article_tracking Users can read own tracking; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read own tracking" ON public.premium_article_tracking FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: newsletter_preferences Users can update own newsletter prefs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own newsletter prefs" ON public.newsletter_preferences FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: payment_requests Users can view own payment requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own payment requests" ON public.payment_requests FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: api_cache; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.api_cache ENABLE ROW LEVEL SECURITY;

--
-- Name: api_health_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.api_health_log ENABLE ROW LEVEL SECURITY;

--
-- Name: article_access_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.article_access_log ENABLE ROW LEVEL SECURITY;

--
-- Name: article_likes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.article_likes ENABLE ROW LEVEL SECURITY;

--
-- Name: articles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

--
-- Name: auth_attempts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.auth_attempts ENABLE ROW LEVEL SECURITY;

--
-- Name: authors; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;

--
-- Name: categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

--
-- Name: comments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

--
-- Name: discussion_comments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.discussion_comments ENABLE ROW LEVEL SECURITY;

--
-- Name: discussions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.discussions ENABLE ROW LEVEL SECURITY;

--
-- Name: dynamic_pricing; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dynamic_pricing ENABLE ROW LEVEL SECURITY;

--
-- Name: education_categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.education_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: education_lessons; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.education_lessons ENABLE ROW LEVEL SECURITY;

--
-- Name: flash_banner; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.flash_banner ENABLE ROW LEVEL SECURITY;

--
-- Name: legal_sections; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.legal_sections ENABLE ROW LEVEL SECURITY;

--
-- Name: legal_sections legal_sections_public_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY legal_sections_public_read ON public.legal_sections FOR SELECT USING (true);


--
-- Name: market_data; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.market_data ENABLE ROW LEVEL SECURITY;

--
-- Name: messages_contact; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.messages_contact ENABLE ROW LEVEL SECURITY;

--
-- Name: newsletter_preferences; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.newsletter_preferences ENABLE ROW LEVEL SECURITY;

--
-- Name: niger_country_facts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.niger_country_facts ENABLE ROW LEVEL SECURITY;

--
-- Name: niger_economic_indicators; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.niger_economic_indicators ENABLE ROW LEVEL SECURITY;

--
-- Name: niger_indicator_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.niger_indicator_history ENABLE ROW LEVEL SECURITY;

--
-- Name: niger_partners; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.niger_partners ENABLE ROW LEVEL SECURITY;

--
-- Name: niger_presentation; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.niger_presentation ENABLE ROW LEVEL SECURITY;

--
-- Name: niger_regions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.niger_regions ENABLE ROW LEVEL SECURITY;

--
-- Name: niger_resource_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.niger_resource_history ENABLE ROW LEVEL SECURITY;

--
-- Name: niger_resources; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.niger_resources ENABLE ROW LEVEL SECURITY;

--
-- Name: page_views; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

--
-- Name: payment_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: paywall_analytics; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.paywall_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: paywall_config; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.paywall_config ENABLE ROW LEVEL SECURITY;

--
-- Name: premium_article_tracking; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.premium_article_tracking ENABLE ROW LEVEL SECURITY;

--
-- Name: rate_limits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

--
-- Name: strategic_enterprises; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.strategic_enterprises ENABLE ROW LEVEL SECURITY;

--
-- Name: subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: user_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict 9eecedhMyyhM8aEE1M6A6vH9WfNDbW3dE3Y5e6Ggi6ccAt5gg1OOKu4ZRWnJQb8


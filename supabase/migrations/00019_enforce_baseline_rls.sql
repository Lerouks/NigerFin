-- 00019_enforce_baseline_rls.sql
-- Securite C-3 : durcit la baseline RLS et corrige les regressions detectees par
-- Supabase advisors (security).
--
-- 1. Force RLS sur toutes les tables `public` baseline. Idempotent : un fresh
--    deploy via 00001_baseline.sql cree desormais les tables avec RLS active,
--    bloquant l'exposition via la cle anon publique.
-- 2. Resserre la policy permissive `Insert paywall_analytics` (WITH CHECK true
--    autorisait n'importe quel event_type cote anon/authenticated). Whitelist
--    alignee sur VALID_EVENTS dans src/app/api/paywall/analytics/route.ts.
-- 3. Fixe search_path mutable sur set_site_features_updated_at() (advisor WARN
--    function_search_path_mutable).
--
-- NOTE OPS : Supabase setting `auth.leaked_password_protection` doit etre
-- active manuellement dans le dashboard (Auth > Settings > Password security).
-- Non gerable via migration SQL.

-- ===== 1. ENABLE RLS (idempotent, no-op si deja active) =====

ALTER TABLE public.api_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_health_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dynamic_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flash_banner ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_path_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages_contact ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.niger_country_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.niger_economic_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.niger_indicator_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.niger_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.niger_presentation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.niger_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.niger_resource_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.niger_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paywall_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paywall_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premium_article_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategic_enterprises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_pdf_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- ===== 2. Resserrer la policy permissive paywall_analytics INSERT =====
-- Avant : WITH CHECK (true) acceptait n'importe quel insert anon/authenticated.
-- Apres : event_type doit etre dans la whitelist alignee sur VALID_EVENTS du code.

DROP POLICY IF EXISTS "Insert paywall_analytics" ON public.paywall_analytics;

CREATE POLICY "Insert paywall_analytics" ON public.paywall_analytics
  FOR INSERT TO anon, authenticated
  WITH CHECK (event_type IN (
    'view',
    'click_primary',
    'click_secondary',
    'continue_reading',
    'dismiss'
  ));

-- ===== 3. Fix search_path mutable sur fonction trigger =====
-- Sans search_path fige, une fonction SECURITY DEFINER peut etre detournee via
-- injection de schema. set_site_features_updated_at est un simple trigger
-- updated_at, mais l'advisor WARN s'applique. On fige a pg_catalog,public.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'set_site_features_updated_at'
  ) THEN
    EXECUTE 'ALTER FUNCTION public.set_site_features_updated_at() SET search_path = pg_catalog, public';
  END IF;
END$$;

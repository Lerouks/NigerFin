-- Réplique minimale du schéma de PRODUCTION des tables que la corbeille touche.
--
-- Générée par scripts/replique-production.py à partir de requêtes en lecture
-- seule sur le catalogue de la production (aucune donnée lue), le 3 novembre
-- 2026. À régénérer si le schéma de production change : le test
-- corbeille-sql vérifie aussi qu'elle couvre toutes les colonnes des types
-- générés (src/types/supabase.generated.ts).
--
-- Ce qu'elle reproduit : colonnes et types, clés primaires et uniques,
-- vérifications, clés étrangères et leur règle ON DELETE (en particulier :
-- comments et article_likes n'ont AUCUNE clé vers articles), index uniques,
-- déclencheurs, RLS, droits par table, et droits par défaut du schéma public.
-- Ce qu'elle ne reproduit pas : les politiques RLS (les fonctions de la
-- corbeille s'exécutent avec les droits de leur propriétaire, qui contourne
-- la RLS comme « postgres » en production), les autres colonnes d'auth.users,
-- les tables que la corbeille ne touche pas.
--
-- « proprietaire » joue le rôle de « postgres » en production : propriétaire
-- des tables et des fonctions, NON superutilisateur, avec BYPASSRLS.

CREATE ROLE anon NOLOGIN NOBYPASSRLS;
CREATE ROLE authenticated NOLOGIN NOBYPASSRLS;
CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE ROLE proprietaire NOLOGIN NOSUPERUSER BYPASSRLS;
GRANT anon, authenticated, service_role TO proprietaire;
CREATE ROLE supabase_auth_admin NOLOGIN NOINHERIT;
GRANT USAGE ON SCHEMA public TO proprietaire, anon, authenticated, service_role;
GRANT CREATE ON SCHEMA public TO proprietaire;

ALTER DEFAULT PRIVILEGES FOR ROLE proprietaire IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE proprietaire IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE proprietaire IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE proprietaire IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE proprietaire IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE proprietaire IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE proprietaire IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE proprietaire IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE proprietaire IN SCHEMA public GRANT ALL ON TABLES TO service_role;

CREATE SCHEMA auth AUTHORIZATION supabase_auth_admin;
GRANT USAGE ON SCHEMA auth TO proprietaire;
CREATE TABLE auth.users (
  id uuid NOT NULL,
  email character varying,
  deleted_at timestamp with time zone,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
ALTER TABLE auth.users OWNER TO supabase_auth_admin;
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;
GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON auth.users TO proprietaire;

SET ROLE proprietaire;

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

CREATE TABLE public.education_lessons (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  category_id uuid NOT NULL,
  title text NOT NULL,
  duration text DEFAULT '5 min'::text NOT NULL,
  access_level text DEFAULT 'free'::text NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  content text DEFAULT ''::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.learning_paths (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  slug text NOT NULL,
  title text NOT NULL,
  description text DEFAULT ''::text NOT NULL,
  icon text DEFAULT 'GraduationCap'::text NOT NULL,
  difficulty text DEFAULT 'Debutant'::text NOT NULL,
  goal_label text DEFAULT ''::text NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  available boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.learning_path_steps (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  path_id uuid NOT NULL,
  lesson_id uuid NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.user_lesson_progress (
  user_id uuid NOT NULL,
  lesson_id uuid NOT NULL,
  completed_at timestamp with time zone,
  last_viewed_at timestamp with time zone DEFAULT now() NOT NULL,
  quiz_score integer,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

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
  main_image_source text
);

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

CREATE TABLE public.article_likes (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  article_id text NOT NULL,
  user_id text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

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
  brand_color text,
  is_featured boolean DEFAULT false NOT NULL
);

CREATE TABLE public.legal_sections (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  page_slug text NOT NULL,
  heading text NOT NULL,
  text text NOT NULL,
  display_order integer DEFAULT 0 NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.newsletter_issues (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  number integer NOT NULL,
  slug text NOT NULL,
  subject text NOT NULL,
  preheader text,
  audience text DEFAULT 'premium'::text NOT NULL,
  content jsonb NOT NULL,
  status text DEFAULT 'draft'::text NOT NULL,
  scheduled_at timestamp with time zone,
  sent_at timestamp with time zone,
  recipients_count integer DEFAULT 0 NOT NULL,
  delivered_count integer DEFAULT 0 NOT NULL,
  opened_count integer DEFAULT 0 NOT NULL,
  clicked_count integer DEFAULT 0 NOT NULL,
  bounced_count integer DEFAULT 0 NOT NULL,
  unsubscribed_count integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.newsletter_subscribers (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  email text NOT NULL,
  status text DEFAULT 'active'::text NOT NULL,
  user_id uuid,
  source text,
  locale text DEFAULT 'fr'::text NOT NULL,
  unsubscribe_token uuid DEFAULT gen_random_uuid() NOT NULL,
  opt_in_at timestamp with time zone DEFAULT now() NOT NULL,
  unsubscribed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.newsletter_events (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  issue_id uuid,
  subscriber_id uuid,
  event_type text NOT NULL,
  meta jsonb,
  occurred_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.article_likes ADD CONSTRAINT article_likes_pkey PRIMARY KEY (id);
ALTER TABLE public.articles ADD CONSTRAINT articles_pkey PRIMARY KEY (id);
ALTER TABLE public.comments ADD CONSTRAINT comments_pkey PRIMARY KEY (id);
ALTER TABLE public.education_categories ADD CONSTRAINT education_categories_pkey PRIMARY KEY (id);
ALTER TABLE public.education_lessons ADD CONSTRAINT education_lessons_pkey PRIMARY KEY (id);
ALTER TABLE public.learning_path_steps ADD CONSTRAINT learning_path_steps_pkey PRIMARY KEY (id);
ALTER TABLE public.learning_paths ADD CONSTRAINT learning_paths_pkey PRIMARY KEY (id);
ALTER TABLE public.legal_sections ADD CONSTRAINT legal_sections_pkey PRIMARY KEY (id);
ALTER TABLE public.newsletter_events ADD CONSTRAINT newsletter_events_pkey PRIMARY KEY (id);
ALTER TABLE public.newsletter_issues ADD CONSTRAINT newsletter_issues_pkey PRIMARY KEY (id);
ALTER TABLE public.newsletter_subscribers ADD CONSTRAINT newsletter_subscribers_pkey PRIMARY KEY (id);
ALTER TABLE public.strategic_enterprises ADD CONSTRAINT strategic_enterprises_pkey PRIMARY KEY (id);
ALTER TABLE public.user_lesson_progress ADD CONSTRAINT user_lesson_progress_pkey PRIMARY KEY (user_id, lesson_id);

ALTER TABLE public.article_likes ADD CONSTRAINT article_likes_article_id_user_id_key UNIQUE (article_id, user_id);
ALTER TABLE public.articles ADD CONSTRAINT articles_slug_key UNIQUE (slug);
ALTER TABLE public.education_categories ADD CONSTRAINT education_categories_slug_key UNIQUE (slug);
ALTER TABLE public.learning_path_steps ADD CONSTRAINT learning_path_steps_path_id_lesson_id_key UNIQUE (path_id, lesson_id);
ALTER TABLE public.learning_paths ADD CONSTRAINT learning_paths_slug_key UNIQUE (slug);
ALTER TABLE public.newsletter_issues ADD CONSTRAINT newsletter_issues_number_key UNIQUE (number);
ALTER TABLE public.newsletter_issues ADD CONSTRAINT newsletter_issues_slug_key UNIQUE (slug);
ALTER TABLE public.newsletter_subscribers ADD CONSTRAINT newsletter_subscribers_email_key UNIQUE (email);

ALTER TABLE public.articles ADD CONSTRAINT articles_category_check CHECK ((category = ANY (ARRAY['economie'::text, 'finance'::text, 'marches'::text, 'entreprises'::text, 'education'::text, 'niger'::text])));
ALTER TABLE public.articles ADD CONSTRAINT articles_content_type_check CHECK ((content_type = ANY (ARRAY['free'::text, 'premium'::text, 'pro'::text])));
ALTER TABLE public.articles ADD CONSTRAINT articles_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])));
ALTER TABLE public.education_lessons ADD CONSTRAINT education_lessons_access_level_check CHECK ((access_level = ANY (ARRAY['free'::text, 'standard'::text, 'premium'::text, 'pro'::text])));
ALTER TABLE public.learning_paths ADD CONSTRAINT learning_paths_difficulty_check CHECK ((difficulty = ANY (ARRAY['Debutant'::text, 'Intermediaire'::text, 'Avance'::text])));
ALTER TABLE public.newsletter_events ADD CONSTRAINT newsletter_events_event_type_check CHECK ((event_type = ANY (ARRAY['delivered'::text, 'opened'::text, 'clicked'::text, 'bounced'::text, 'complained'::text, 'unsubscribed'::text])));
ALTER TABLE public.newsletter_issues ADD CONSTRAINT newsletter_issues_audience_check CHECK ((audience = ANY (ARRAY['premium'::text, 'all'::text, 'free'::text])));
ALTER TABLE public.newsletter_issues ADD CONSTRAINT newsletter_issues_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'scheduled'::text, 'sending'::text, 'sent'::text, 'cancelled'::text])));
ALTER TABLE public.newsletter_subscribers ADD CONSTRAINT newsletter_subscribers_status_check CHECK ((status = ANY (ARRAY['active'::text, 'unsubscribed'::text, 'bounced'::text, 'complained'::text])));

ALTER TABLE public.comments ADD CONSTRAINT fk_parent_comment FOREIGN KEY (parent_comment_id) REFERENCES comments(id) ON DELETE CASCADE;
ALTER TABLE public.education_lessons ADD CONSTRAINT education_lessons_category_id_fkey FOREIGN KEY (category_id) REFERENCES education_categories(id) ON DELETE CASCADE;
ALTER TABLE public.learning_path_steps ADD CONSTRAINT learning_path_steps_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES education_lessons(id) ON DELETE CASCADE;
ALTER TABLE public.learning_path_steps ADD CONSTRAINT learning_path_steps_path_id_fkey FOREIGN KEY (path_id) REFERENCES learning_paths(id) ON DELETE CASCADE;
ALTER TABLE public.newsletter_events ADD CONSTRAINT newsletter_events_issue_id_fkey FOREIGN KEY (issue_id) REFERENCES newsletter_issues(id) ON DELETE CASCADE;
ALTER TABLE public.newsletter_events ADD CONSTRAINT newsletter_events_subscriber_id_fkey FOREIGN KEY (subscriber_id) REFERENCES newsletter_subscribers(id) ON DELETE SET NULL;
ALTER TABLE public.newsletter_subscribers ADD CONSTRAINT newsletter_subscribers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.user_lesson_progress ADD CONSTRAINT user_lesson_progress_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES education_lessons(id) ON DELETE CASCADE;
ALTER TABLE public.user_lesson_progress ADD CONSTRAINT user_lesson_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX idx_article_likes_article ON public.article_likes USING btree (article_id);
CREATE INDEX idx_article_likes_user ON public.article_likes USING btree (user_id, article_id);
CREATE INDEX idx_articles_category ON public.articles USING btree (category);
CREATE INDEX idx_articles_featured ON public.articles USING btree (is_featured, featured_order);
CREATE INDEX idx_articles_published_at ON public.articles USING btree (published_at DESC);
CREATE INDEX idx_articles_sections ON public.articles USING gin (sections);
CREATE INDEX idx_articles_slug ON public.articles USING btree (slug);
CREATE INDEX idx_articles_status ON public.articles USING btree (status);
CREATE INDEX idx_comments_article ON public.comments USING btree (article_id);
CREATE INDEX idx_comments_article_id ON public.comments USING btree (article_id);
CREATE INDEX idx_comments_parent ON public.comments USING btree (parent_comment_id);
CREATE INDEX idx_comments_parent_id ON public.comments USING btree (parent_comment_id);
CREATE INDEX idx_learning_path_steps_path_order ON public.learning_path_steps USING btree (path_id, sort_order);
CREATE INDEX idx_legal_sections_page_slug ON public.legal_sections USING btree (page_slug, display_order);
CREATE INDEX idx_newsletter_events_issue ON public.newsletter_events USING btree (issue_id, event_type);
CREATE INDEX idx_newsletter_events_subscriber ON public.newsletter_events USING btree (subscriber_id, event_type) WHERE (subscriber_id IS NOT NULL);
CREATE INDEX idx_newsletter_issues_sent_desc ON public.newsletter_issues USING btree (sent_at DESC NULLS LAST) WHERE (status = 'sent'::text);
CREATE INDEX idx_newsletter_issues_status ON public.newsletter_issues USING btree (status);
CREATE INDEX idx_newsletter_subscribers_status ON public.newsletter_subscribers USING btree (status);
CREATE UNIQUE INDEX idx_newsletter_subscribers_unsubscribe_token ON public.newsletter_subscribers USING btree (unsubscribe_token);
CREATE INDEX idx_newsletter_subscribers_user_id ON public.newsletter_subscribers USING btree (user_id) WHERE (user_id IS NOT NULL);
CREATE UNIQUE INDEX strategic_enterprises_only_one_featured ON public.strategic_enterprises USING btree (is_featured) WHERE (is_featured = true);
CREATE UNIQUE INDEX strategic_enterprises_slug_key ON public.strategic_enterprises USING btree (slug);
CREATE INDEX idx_user_lesson_progress_user ON public.user_lesson_progress USING btree (user_id);

CREATE OR REPLACE FUNCTION public.update_articles_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.newsletter_issues_assign_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  if new.number is null then
    new.number := coalesce((select max(number) + 1 from public.newsletter_issues), 1);
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.newsletter_set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin new.updated_at := now(); return new; end;
$function$;

CREATE TRIGGER articles_updated_at BEFORE UPDATE ON public.articles FOR EACH ROW EXECUTE FUNCTION update_articles_updated_at();
CREATE TRIGGER trg_learning_paths_updated_at BEFORE UPDATE ON public.learning_paths FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER newsletter_issues_assign_number BEFORE INSERT ON public.newsletter_issues FOR EACH ROW EXECUTE FUNCTION newsletter_issues_assign_number();
CREATE TRIGGER newsletter_issues_set_updated_at BEFORE UPDATE ON public.newsletter_issues FOR EACH ROW EXECUTE FUNCTION newsletter_set_updated_at();
CREATE TRIGGER newsletter_subscribers_set_updated_at BEFORE UPDATE ON public.newsletter_subscribers FOR EACH ROW EXECUTE FUNCTION newsletter_set_updated_at();
CREATE TRIGGER trg_user_lesson_progress_updated_at BEFORE UPDATE ON public.user_lesson_progress FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public.article_likes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.article_likes FROM PUBLIC, anon, authenticated, service_role;
GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON public.article_likes TO anon;
GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON public.article_likes TO authenticated;
GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON public.article_likes TO service_role;

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.articles FROM PUBLIC, anon, authenticated, service_role;
GRANT INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON public.articles TO anon;
GRANT INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON public.articles TO authenticated;
GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON public.articles TO service_role;

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.comments FROM PUBLIC, anon, authenticated, service_role;
GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON public.comments TO anon;
GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON public.comments TO authenticated;
GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON public.comments TO service_role;

ALTER TABLE public.education_categories ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.education_categories FROM PUBLIC, anon, authenticated, service_role;
GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON public.education_categories TO anon;
GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON public.education_categories TO authenticated;
GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON public.education_categories TO service_role;

ALTER TABLE public.education_lessons ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.education_lessons FROM PUBLIC, anon, authenticated, service_role;
GRANT INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON public.education_lessons TO anon;
GRANT INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON public.education_lessons TO authenticated;
GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON public.education_lessons TO service_role;

ALTER TABLE public.learning_path_steps ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.learning_path_steps FROM PUBLIC, anon, authenticated, service_role;
GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON public.learning_path_steps TO anon;
GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON public.learning_path_steps TO authenticated;
GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON public.learning_path_steps TO service_role;

ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.learning_paths FROM PUBLIC, anon, authenticated, service_role;
GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON public.learning_paths TO anon;
GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON public.learning_paths TO authenticated;
GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON public.learning_paths TO service_role;

ALTER TABLE public.legal_sections ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.legal_sections FROM PUBLIC, anon, authenticated, service_role;
GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON public.legal_sections TO anon;
GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON public.legal_sections TO authenticated;
GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON public.legal_sections TO service_role;

ALTER TABLE public.newsletter_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.newsletter_events FROM PUBLIC, anon, authenticated, service_role;
GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON public.newsletter_events TO authenticated;
GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON public.newsletter_events TO service_role;

ALTER TABLE public.newsletter_issues ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.newsletter_issues FROM PUBLIC, anon, authenticated, service_role;
GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON public.newsletter_issues TO anon;
GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON public.newsletter_issues TO authenticated;
GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON public.newsletter_issues TO service_role;

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.newsletter_subscribers FROM PUBLIC, anon, authenticated, service_role;
GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON public.newsletter_subscribers TO authenticated;
GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON public.newsletter_subscribers TO service_role;

ALTER TABLE public.strategic_enterprises ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.strategic_enterprises FROM PUBLIC, anon, authenticated, service_role;
GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON public.strategic_enterprises TO anon;
GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON public.strategic_enterprises TO authenticated;
GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON public.strategic_enterprises TO service_role;

ALTER TABLE public.user_lesson_progress ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_lesson_progress FROM PUBLIC, anon, authenticated, service_role;
GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON public.user_lesson_progress TO anon;
GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON public.user_lesson_progress TO authenticated;
GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON public.user_lesson_progress TO service_role;

RESET ROLE;

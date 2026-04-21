-- Harden 9 functions by fixing search_path (prevents search_path injection attacks).
ALTER FUNCTION public.cleanup_rate_limits() SET search_path = public, pg_temp;
ALTER FUNCTION public.reset_market_previous_close() SET search_path = public, pg_temp;
ALTER FUNCTION public.set_featured_article(target_article_id uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.unfeature_article(target_article_id uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.set_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.reset_monthly_premium_count() SET search_path = public, pg_temp;
ALTER FUNCTION public.increment_premium_count(p_user_id uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.update_articles_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_market_data_timestamp() SET search_path = public, pg_temp;

-- Harden article-images storage bucket: remove broad SELECT policy that allowed listing.
-- Public object URLs will keep working (bucket is public), but LIST via API is blocked.
DROP POLICY IF EXISTS "Public read access on article images" ON storage.objects;

-- Comments INSERT: prevent impersonation at the RLS layer (API already enforces this server-side).
DROP POLICY IF EXISTS "Authenticated users can insert comments" ON public.comments;
CREATE POLICY "Authenticated users can insert comments" ON public.comments
  FOR INSERT TO authenticated
  WITH CHECK ((auth.uid())::text = user_id);

-- Remove redundant "service role full access" policies. Service role already bypasses RLS.
DROP POLICY IF EXISTS "Service role full access on api_cache" ON public.api_cache;
DROP POLICY IF EXISTS "Service role full access on api_health_log" ON public.api_health_log;
DROP POLICY IF EXISTS "Service role full access" ON public.page_views;

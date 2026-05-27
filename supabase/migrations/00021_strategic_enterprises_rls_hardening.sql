-- Durcit la policy RLS de strategic_enterprises : la policy "Public read access"
-- USING (true) exposait les rows is_visible=false (brouillons, retirees) a tout
-- client utilisant la cle anon publique. Le code applicatif filtre deja avec
-- .eq('is_visible', true), mais la defense en profondeur impose un filtre RLS.
--
-- Identifie par security-reviewer (MEDIUM-2) le 2026-05-27, post-deploy refonte
-- atlas. Impact : fuite editoriale (brouillons visibles), pas de donnees
-- personnelles.
--
-- Le service_role bypasse les policies RLS donc createServiceClient() (utilise
-- par /api/strategic-enterprises et le helper lib/strategic-enterprises.ts)
-- continue de fonctionner.

DROP POLICY IF EXISTS "Public read access" ON public.strategic_enterprises;

CREATE POLICY "Public read visible only" ON public.strategic_enterprises
  FOR SELECT
  USING (is_visible = true);

-- Note : pas de policy explicite pour service_role car il bypasse RLS par defaut.
-- Les policies d'ecriture (insert/update/delete) existantes sont conservees,
-- elles restent reservees au service_role via les routes admin gated.

COMMENT ON POLICY "Public read visible only" ON public.strategic_enterprises IS
  'Hardening 2026-05-27 : limite la lecture anon aux entreprises is_visible=true. Brouillons accessibles uniquement via service_role (admin).';

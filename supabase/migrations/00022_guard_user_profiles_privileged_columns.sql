-- ============================================================================
-- 00022 — Anti auto-promotion sur user_profiles (faille critique RLS)
--
-- La policy "Users can update own profile" est FOR UPDATE USING (auth.uid()=id)
-- SANS WITH CHECK : Postgres reutilise alors USING comme controle d'ecriture, si
-- bien qu'un utilisateur connecte pouvait modifier N'IMPORTE quelle colonne de SA
-- ligne, dont role='admin'/'premium' et subscription_* — donc s'octroyer Premium
-- ou Admin gratuitement depuis la console du navigateur (l'acces est gate serveur
-- sur user_profiles.role + subscription_end).
--
-- Correctif : trigger BEFORE UPDATE qui bloque, POUR LES SESSIONS CLIENT
-- uniquement (roles 'authenticated'/'anon'), toute modification des colonnes
-- privilegiees. Les flux legitimes (paiement, admin) ecrivent via le service role
-- (current_user='service_role') et passent librement, comme les migrations
-- (postgres). Aucun flux client legitime ne touche ces colonnes -> zero regression
-- (le client garde le droit de modifier full_name, avatar, etc.).
--
-- Applique en prod le 2026-07-18 (verifie : maj nom OK, auto-promotion bloquee,
-- activation Premium par service role OK). Reversible :
--   DROP TRIGGER trg_guard_user_profiles_privileged_cols ON public.user_profiles;
--   DROP FUNCTION public.guard_user_profiles_privileged_cols();
-- ============================================================================

CREATE OR REPLACE FUNCTION public.guard_user_profiles_privileged_cols()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
BEGIN
  -- N'entrave que les sessions client (supabase-js cote navigateur).
  -- service_role (paiement/admin) et postgres (migrations) passent librement.
  IF current_user NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  IF (NEW.role IS DISTINCT FROM OLD.role)
     OR (NEW.subscription_status     IS DISTINCT FROM OLD.subscription_status)
     OR (NEW.subscription_start      IS DISTINCT FROM OLD.subscription_start)
     OR (NEW.subscription_end        IS DISTINCT FROM OLD.subscription_end)
     OR (NEW.subscription_updated_at IS DISTINCT FROM OLD.subscription_updated_at)
     OR (NEW.expiration_warning_sent IS DISTINCT FROM OLD.expiration_warning_sent)
  THEN
    RAISE EXCEPTION 'Modification de champs privilegies (role / abonnement) interdite depuis une session client';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_user_profiles_privileged_cols ON public.user_profiles;
CREATE TRIGGER trg_guard_user_profiles_privileged_cols
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_user_profiles_privileged_cols();

-- ============================================================================
-- 00024 — Repare reset_market_previous_close (variations quotidiennes fausses)
--
-- SYMPTOME CONSTATE EN PROD LE 2026-07-20
-- Le site publiait des variations de seance aberrantes sur TOUS les indicateurs :
--   IXIC  affiche +12,44 %  alors que la source Yahoo indiquait -2,85 % ce jour
--   GSPC  affiche  +9,74 %  alors que la source indiquait -1,51 %
--   XAU   affiche -10,85 %  alors que la source indiquait environ -0,5 %
--   U3O8  affiche -24,11 %
-- Un Nasdaq a +12 % en une seance est un chiffre invente. Or NFI Report ne doit
-- jamais publier de chiffre invente.
--
-- CAUSE RACINE
-- /api/cron/update-market-data calcule change et change_percent en comparant la
-- valeur fraiche a market_data.previous_close. Ce previous_close doit etre remis
-- a niveau chaque nuit par le cron /api/cron/reset-market-close (0 0 * * *), qui
-- appelle cette fonction. Or le corps de la fonction faisait :
--
--     UPDATE market_data SET previous_close = value, ... ;   -- sans WHERE
--
-- Supabase active l'extension de garde pg-safeupdate, qui REFUSE tout UPDATE
-- depourvu de clause WHERE avec l'erreur 21000 « UPDATE requires a WHERE clause ».
-- La fonction echouait donc a chaque appel, depuis sa creation. previous_close
-- n'a jamais ete reinitialise une seule fois : la « variation du jour » affichee
-- etait en realite une derive cumulee depuis une date arbitraire.
--
-- CORRECTIF
-- Ajout d'une clause WHERE explicite. On ne remet a zero que les lignes dont le
-- previous_close doit reellement bouger, et la fonction devient idempotente :
-- la rejouer deux fois dans la meme nuit ne fausse rien.
--
-- REVERSIBLE : rejouer la definition precedente (sans WHERE), presente dans
-- supabase/snapshots/2026-04-17_schema.sql lignes 97-105. Cela retablirait
-- toutefois le bug ; la seule raison de le faire serait une enquete historique.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.reset_market_previous_close()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  UPDATE public.market_data
  SET previous_close = value,
      change = 0,
      change_percent = 0,
      updated_at = now()
  WHERE previous_close IS DISTINCT FROM value
     OR change IS DISTINCT FROM 0
     OR change_percent IS DISTINCT FROM 0;
$$;

COMMENT ON FUNCTION public.reset_market_previous_close() IS
  'Cloture quotidienne : aligne previous_close sur la derniere valeur connue et remet la variation a zero, pour que change/change_percent mesurent bien la variation du jour et non une derive cumulee. La clause WHERE est OBLIGATOIRE (extension pg-safeupdate) et rend la fonction idempotente.';

-- La fonction reste reservee au service role : appelee par le cron via
-- createServiceClient(). Aucun client navigateur ne doit pouvoir la declencher.
REVOKE ALL ON FUNCTION public.reset_market_previous_close() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reset_market_previous_close() TO service_role;

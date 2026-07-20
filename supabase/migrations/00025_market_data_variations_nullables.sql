-- ============================================================================
-- 00025 — market_data : une variation inconnue doit pouvoir rester inconnue
--
-- PROBLEME
-- Les colonnes `change` et `change_percent` etaient NOT NULL DEFAULT 0. Le
-- schema rendait donc l'ignorance IMPOSSIBLE A EXPRIMER : toute ligne creee sans
-- variation mesuree naissait a 0, et l'interface affichait alors le mot
-- « Stable », c'est-a-dire une affirmation editoriale sur l'etat du marche que
-- personne n'avait jamais mesuree.
--
-- `0` et `NULL` ne disent pas la meme chose :
--   0     le cours a ete observe et n'a pas bouge
--   NULL  personne n'a mesure
-- Les confondre revient a fabriquer de l'information, ce que NFI Report s'interdit.
--
-- CORRECTIF
-- Colonnes rendues nullables, valeurs par defaut retirees. Une variation non
-- mesuree reste NULL de bout en bout : l'API la transmet telle quelle (et ne la
-- convertit plus via Number(null) qui vaut 0), et l'interface affiche un tiret
-- neutre, sans fleche ni couleur.
--
-- previous_close subit le meme traitement : un « cours de cloture precedent a
-- zero » n'a aucun sens et faussait le calcul de la variation.
--
-- AUCUNE DONNEE N'EST MODIFIEE ici : les lignes existantes gardent leurs valeurs.
-- Seule la contrainte change, pour que l'absence devienne exprimable.
--
-- REVERSIBLE :
--   UPDATE public.market_data SET change = 0 WHERE change IS NULL;
--   UPDATE public.market_data SET change_percent = 0 WHERE change_percent IS NULL;
--   UPDATE public.market_data SET previous_close = 0 WHERE previous_close IS NULL;
--   ALTER TABLE public.market_data
--     ALTER COLUMN change SET DEFAULT 0, ALTER COLUMN change SET NOT NULL,
--     ALTER COLUMN change_percent SET DEFAULT 0, ALTER COLUMN change_percent SET NOT NULL,
--     ALTER COLUMN previous_close SET DEFAULT 0;
-- ============================================================================

ALTER TABLE public.market_data
  ALTER COLUMN change DROP NOT NULL,
  ALTER COLUMN change DROP DEFAULT,
  ALTER COLUMN change_percent DROP NOT NULL,
  ALTER COLUMN change_percent DROP DEFAULT,
  ALTER COLUMN previous_close DROP DEFAULT;

COMMENT ON COLUMN public.market_data.change IS
  'Variation absolue depuis la cloture precedente. NULL = non mesuree (ne jamais ecrire 0 pour signifier une absence de mesure).';

COMMENT ON COLUMN public.market_data.change_percent IS
  'Variation en pourcentage depuis la cloture precedente. NULL = non mesuree. L''interface affiche alors un tiret, jamais « Stable ».';

COMMENT ON COLUMN public.market_data.previous_close IS
  'Cours de cloture precedent, realigne chaque nuit par reset_market_previous_close (voir migration 00024). NULL tant qu''aucune cloture n''a ete enregistree.';

-- ============================================================================
-- 00027 — market_data.value nullable + neutralisation des valeurs fabriquees
--
-- DECISION (Raouf, 2026-07-20) : Option B.
-- On ne SUPPRIME pas les lignes BRVMC (BRVM Composite) et U3O8 (uranium) : on
-- VIDE leur valeur, et l'interface affiche « donnee indisponible » a la place du
-- chiffre. Le lecteur voit ainsi que l'indicateur existe et que NFI Report ne le
-- publie pas, faute de source fiable, plutot que de le voir disparaitre en
-- silence. C'est un signal de serieux : on prefere dire « je ne sais pas » que
-- d'inventer.
--
-- Rappel du probleme : ces deux valeurs (417,00 et 65,00) etaient fabriquees.
--   BRVMC : aucune source BRVM vivante (brvm.org/api/quotes repond 404).
--   U3O8  : le ticker Yahoo UX=F n'est pas le spot uranium (horodatage fige).
-- Le code ne les reecrit plus (voir migrations et commits precedents), mais les
-- lignes deja en base les servaient encore.
--
-- Prealable : market_data.value etait NOT NULL, l'absence de valeur etait donc
-- inexprimable (comme l'etaient change / change_percent avant la migration
-- 00025). On rend la colonne nullable.
--
-- Les autres lignes (or, petrole, forex, indices mondiaux, crypto) proviennent
-- de vraies sources et ne sont PAS touchees.
--
-- Purge en parallele de l'empreinte du mensonge dans api_cache, pour que la
-- supervision cesse de rapporter des succes sur des sources mortes.
--
-- REVERSIBLE :
--   ALTER TABLE public.market_data ALTER COLUMN value SET NOT NULL;  -- echouera
--     tant que des lignes ont value IS NULL ; il faut d'abord leur affecter une
--     vraie valeur ou les supprimer. C'est voulu : on ne remet pas 417 « pour
--     satisfaire la contrainte ».
-- ============================================================================

-- 1) Rendre l'absence de valeur exprimable
ALTER TABLE public.market_data ALTER COLUMN value DROP NOT NULL;

COMMENT ON COLUMN public.market_data.value IS
  'Derniere valeur connue de l''indicateur. NULL = donnee indisponible (aucune source fiable) : l''interface affiche « donnee indisponible », jamais un chiffre invente ni un zero.';

-- 2) Neutraliser les deux valeurs fabriquees (Option B : on vide, on ne supprime pas)
UPDATE public.market_data
SET value = NULL,
    change = NULL,
    change_percent = NULL,
    previous_close = NULL,
    source = NULL,
    updated_at = now()
WHERE symbol IN ('BRVMC', 'U3O8');

-- 3) Empreinte du mensonge dans le cache applicatif
DELETE FROM public.api_cache WHERE source IN ('brvm', 'commodities');

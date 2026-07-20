-- ============================================================================
-- 00026 — Les articles « marches » remontent dans « finance »
--
-- CONTEXTE
-- La rubrique Marches sort de la barre de navigation : ses articles rejoignent
-- Finance, ou ils sont retrouvables par la facette « Marches & BRVM ». La page
-- /marches, elle, RESTE accessible en 200 et n'est JAMAIS redirigee, et la cle
-- « marches » reste reconnue partout (SECTION_META, affichage des badges).
--
-- CE QUE FAIT CETTE MIGRATION
-- Ajoute 'finance' au tableau `sections` des articles qui portent 'marches',
-- SANS retirer 'marches'. Conserver la cle est indispensable :
--   1. elle alimente la facette « Marches & BRVM » sur /finance ;
--   2. elle evite de casser les liens de tag des articles deja publies.
--
-- PORTEE MESUREE AVANT EXECUTION (2026-07-20)
-- 8 articles publies au total. UN SEUL porte 'marches' :
--   « Marches sous tension : l'ultimatum americain sur l'Iran fait grimper le
--     petrole », sections [marches, economie], publie le 07/04/2026.
-- Aucun article ne porte deja les deux cles, donc aucun doublon a traiter.
-- La deduplication ci-dessous est neanmoins ecrite pour rester correcte si de
-- nouveaux articles apparaissent avant l'execution.
--
-- IDEMPOTENTE : rejouable sans effet de bord, grace au NOT ... @> ARRAY['finance'].
--
-- REVERSIBLE :
--   UPDATE public.articles
--   SET sections = array_remove(sections, 'finance')
--   WHERE sections @> ARRAY['marches']::text[]
--     AND sections @> ARRAY['finance']::text[];
--   -- Attention : a n'executer que si aucun de ces articles n'a ete classe
--   -- manuellement en Finance depuis, sous peine de retirer un choix editorial.
-- ============================================================================

UPDATE public.articles
SET sections = sections || ARRAY['finance']::text[]
WHERE sections @> ARRAY['marches']::text[]
  AND NOT (sections @> ARRAY['finance']::text[]);

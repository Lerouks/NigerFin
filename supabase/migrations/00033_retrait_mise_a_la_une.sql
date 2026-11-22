-- 22/11/2026 : la mise « à la une » d'un article est retirée du site, sur
-- décision de la direction. L'accueil commence par les dernières actualités.
-- Le code ne l'appelle plus depuis le commit 77714e7 (route
-- /api/admin/articles/featured supprimée) et plus aucun article n'est à la
-- une en base. Aucune autre fonction n'appelait ces deux-là (vérifié dans
-- pg_proc le même jour).
--
-- Les colonnes articles.is_featured et articles.featured_order restent : la
-- corbeille (00032) les copie et les restaure, et elles ne servent plus à rien
-- d'autre. Retour arrière : recréer les fonctions depuis 00001_baseline.sql.

DROP FUNCTION IF EXISTS public.set_featured_article(target_article_id uuid);
DROP FUNCTION IF EXISTS public.unfeature_article(target_article_id uuid);

-- 00031 : ferme la fuite du contenu payant.
--
-- Constat du 2026-08-26, reproduit avec la seule cle publique du site :
--   - articles           : l'article premium sortait avec son corps entier (3 336 caracteres)
--   - education_lessons  : les 35 lecons premium sortaient d'un bloc (116 956 caracteres)
-- Cause : Supabase accorde par defaut SELECT sur la TABLE entiere aux roles anon et
-- authenticated, colonnes de contenu comprises, et les policies laissent passer la
-- ligne complete. Le site, lui, filtrait correctement en TypeScript, mais qui
-- interrogeait la base directement contournait ce filtre.
--
-- Correctif : le SELECT au niveau table est retire aux roles publics, puis reaccorde
-- colonne par colonne, contenu exclu. Les metadonnees (titre, extrait, duree, niveau
-- d'acces, image, SEO) restent lisibles, ce qui preserve les listes, les teasers, les
-- jointures de parcours et le referencement. Le site continue de servir le contenu
-- par ses routes serveur, qui utilisent la cle de service et verifient l'abonnement.
--
-- ATTENTION, un REVOKE au niveau colonne seul ne suffit PAS : Postgres ignore une
-- restriction de colonne tant qu'un droit existe au niveau de la table. D'ou la
-- sequence REVOKE table puis GRANT colonnes.
--
-- CONSEQUENCE A CONNAITRE : une colonne ajoutee plus tard a l'une de ces deux tables
-- ne sera pas lisible avec la cle publique tant qu'elle n'est pas ajoutee ici. C'est
-- volontaire : le defaut sur est « non lisible ». Le site lisant tout avec la cle de
-- service, cela reste sans effet sur l'affichage.
--
-- Verifie avant ecriture : aucune lecture de articles.body ni de
-- education_lessons.content n'est faite avec la cle publique par le site, et aucune
-- requete publique ne fait de select('*') sur ces deux tables (un select etoile
-- echouerait sur une table a droits par colonne).

-- articles : tout sauf « body »
REVOKE SELECT ON public.articles FROM anon, authenticated;
GRANT SELECT (
  id, title, subtitle, slug, excerpt, category, content_type, is_featured,
  featured_order, author_name, author_avatar, main_image_url, main_image_alt,
  read_time, tags, seo_title, seo_description, status, published_at,
  created_at, updated_at, sections, main_image_caption, main_image_source
) ON public.articles TO anon, authenticated;

-- education_lessons : tout sauf « content »
REVOKE SELECT ON public.education_lessons FROM anon, authenticated;
GRANT SELECT (
  id, category_id, title, duration, access_level, sort_order,
  created_at, updated_at
) ON public.education_lessons TO anon, authenticated;

COMMENT ON COLUMN public.articles.body IS
  'Contenu de l''article. Lisible par la seule cle de service : voir migration 00031.';
COMMENT ON COLUMN public.education_lessons.content IS
  'Contenu de la lecon. Lisible par la seule cle de service : voir migration 00031.';

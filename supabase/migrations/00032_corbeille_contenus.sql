-- Corbeille des contenus supprimés (version 2 : tout se passe dans la base).
--
-- Pourquoi une corbeille : supprimer un article, une leçon ou une fiche depuis
-- l'administration effaçait la ligne pour de bon, sans trace. Le seul recours
-- était la sauvegarde de la nuit précédente, donc la perte de la journée.
--
-- Pourquoi une table séparée plutôt qu'une colonne « supprimé le » : une
-- colonne obligerait à filtrer les lignes supprimées dans CHAQUE requête du
-- site public, et un seul oubli ferait réapparaître un article retiré. Ici, la
-- ligne quitte réellement sa table, et sa copie dort dans une table que seules
-- les routes d'administration lisent.
--
-- Pourquoi des fonctions SQL : la première version (jamais appliquée) copiait,
-- supprimait et restaurait depuis le serveur Next.js, en plusieurs requêtes
-- successives. Deux revues ont montré ce que cela coûtait : une ligne écrite
-- entre la copie et la suppression partait sans être copiée ; une restauration
-- interrompue laissait le contenu « à moitié revenu », et l'écran conseillait
-- alors de supprimer définitivement une entrée qui contenait encore des
-- leçons. Chaque opération est désormais UNE fonction, donc UNE transaction :
-- elle aboutit en entier, ou ne laisse aucune trace.
--
--   corbeille_mettre(table, id, par)    verrouille le contenu, supprime
--       lui-même ce que la base effacerait avec lui, en le gardant
--       (DELETE ... RETURNING : la copie est exactement ce qui part, dans la
--       version qui part), supprime le contenu, puis écrit l'entrée ;
--   corbeille_restaurer(entree)          remet le contenu et tout ce qui en
--       dépend, ou rien du tout, puis retire l'entrée ;
--   corbeille_retirer_lecteur(lecteur)   retire d'un coup les lignes d'un
--       lecteur de toutes les entrées, quand il supprime son compte ;
--   corbeille_purger(jours)              supprime les entrées dont le
--       dernier jour récupérable est passé (le jour de leur mise à la
--       corbeille plus N jours, 30 au minimum, en date de Niamey : celui que
--       l'écran affiche) et les lignes des lecteurs dont le compte n'existe
--       plus.
--
-- Ce qui est copié avec un contenu : SEULEMENT ce que la base de production
-- efface avec lui, d'après ses clés étrangères réelles (relevées en lecture
-- seule le 3 novembre 2026, qui diffèrent des migrations de ce dépôt) :
--   leçon           ses étapes de parcours et la progression des lecteurs ;
--   catégorie       ses leçons, et pour chacune ses étapes et progressions ;
--   numéro          ses événements d'envoi, sans meta.raw, où le webhook
--                   recopie l'adresse des destinataires ;
--   article, fiche entreprise, section de page légale : rien d'autre.
-- Les commentaires et les j'aime d'un article ne sont PAS copiés : en
-- production, comments.article_id et article_likes.article_id sont du texte
-- sans clé étrangère. Ils survivent à l'article (la modération les montre sous
-- « Article supprimé ») et le retrouvent s'il revient. La première version les
-- copiait, et faisait donc revenir des commentaires que la modération avait
-- supprimés entre-temps. Si une clé étrangère, un déclencheur ou une règle de
-- suppression venait un jour à effacer autre chose avec un contenu,
-- corbeille_mettre refuserait la suppression plutôt que de perdre ces lignes
-- en silence.
--
-- Une seule entrée par contenu (index unique) : une ancienne copie ne peut
-- jamais remettre en ligne une version périmée.
--
-- Application : à la main, avec « supabase db query --linked --file »,
-- jamais avec « db push » (l'historique des migrations de ce dépôt n'est pas
-- celui de la production). Le fichier est encadré par BEGIN et COMMIT : il
-- s'applique en entier ou pas du tout. lock_timeout : la clé étrangère vers
-- auth.users verrouille brièvement auth.users ; derrière une transaction
-- longue, la migration abandonne au bout de 5 secondes au lieu de bloquer les
-- connexions des lecteurs qui arrivent derrière elle. Rejouable sans effet de
-- bord. Vérifications et retour arrière : en fin de fichier.

BEGIN;

SET LOCAL lock_timeout = '5s';

CREATE TABLE IF NOT EXISTS public.contenus_supprimes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- La table d'où vient la ligne, donc celle où la restauration écrira : une
  -- des six tables de contenu, aucune autre.
  table_origine text NOT NULL
    CONSTRAINT contenus_supprimes_table_origine_check CHECK (
      table_origine IN (
        'articles',
        'education_lessons',
        'education_categories',
        'strategic_enterprises',
        'legal_sections',
        'newsletter_issues'
      )
    ),
  id_origine uuid NOT NULL,
  -- Recopié à part pour que la liste se lise sans déplier la copie.
  titre text NOT NULL,
  -- La ligne entière, telle qu'elle était au moment où elle est partie.
  donnees jsonb NOT NULL
    CONSTRAINT contenus_supprimes_donnees_check CHECK (
      jsonb_typeof(donnees) = 'object' AND donnees ->> 'id' = id_origine::text
    ),
  -- Ce que la base a effacé avec elle, par table : { "education_lessons": [...] }.
  dependants jsonb NOT NULL DEFAULT '{}'::jsonb
    CONSTRAINT contenus_supprimes_dependants_check CHECK (jsonb_typeof(dependants) = 'object'),
  -- Leur nombre par table, pour que l'écran l'affiche sans télécharger les lignes.
  resume_dependants jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- Les comptes de lecteurs présents dans dependants (progression des leçons).
  lecteurs uuid[] NOT NULL DEFAULT '{}',
  supprime_le timestamptz NOT NULL DEFAULT now(),
  supprime_par uuid REFERENCES auth.users (id) ON DELETE SET NULL
);

-- Une seule entrée par contenu. Sans cela, une vieille copie pouvait remettre
-- en ligne une version périmée, et un double clic créait deux entrées.
CREATE UNIQUE INDEX IF NOT EXISTS contenus_supprimes_un_par_contenu
  ON public.contenus_supprimes (table_origine, id_origine);
-- La liste (les plus récentes d'abord) et la purge (les plus anciennes).
CREATE INDEX IF NOT EXISTS contenus_supprimes_supprime_le
  ON public.contenus_supprimes (supprime_le);
-- Retrouver vite les entrées d'un lecteur qui supprime son compte.
CREATE INDEX IF NOT EXISTS contenus_supprimes_lecteurs
  ON public.contenus_supprimes USING gin (lecteurs);

-- RLS active et AUCUNE politique : un rôle soumis à la RLS n'y voit rien.
ALTER TABLE public.contenus_supprimes ENABLE ROW LEVEL SECURITY;

-- Sur ce projet, le REVOKE ci-dessous est INDISPENSABLE, pas une précaution :
-- les droits par défaut du schéma public (pg_default_acl, relevés en
-- production le 3 novembre 2026) donnent encore TOUS les droits à anon et
-- authenticated sur chaque table neuve. Sans lui, la clé publique du site
-- lirait la corbeille, donc des articles premium retirés et la progression
-- des lecteurs, et pourrait y écrire. La RLS sans politique ne suffit pas à
-- s'en remettre : c'est le piège de la migration 00031, où un droit accordé au
-- niveau de la table a suffi à tout ouvrir.
-- service_role ne reçoit que la lecture (la liste) et la suppression (la
-- suppression définitive) : toute écriture passe par les fonctions ci-dessous,
-- qui seules savent garder une entrée cohérente.
REVOKE ALL ON public.contenus_supprimes FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT, DELETE ON public.contenus_supprimes TO service_role;

-- Chaque fonction publique attend un verrou 5 secondes au plus
-- (lock_timeout) : derrière une ligne verrouillée trop longtemps, elle
-- abandonne sans rien avoir fait, et l'écran propose de réessayer, au lieu de
-- laisser la page de l'administration attendre sans fin.

-- Fonction interne : écrit des lignes gardées en jsonb dans leur table, et
-- vérifie qu'elle les a TOUTES écrites, avec toutes leurs valeurs. Deux
-- refus, qui annulent la restauration entière et laissent l'entrée intacte :
--   colonnes_inconnues   la copie remplit une colonne que la table n'a plus
--       (renommée ou supprimée depuis la suppression) : écrire le reste
--       perdrait sa valeur sans un mot, puis l'entrée, seule autre copie ;
--   remise_incomplete    la table a écarté sans erreur une partie des lignes
--       (un déclencheur BEFORE INSERT qui renvoie NULL, une règle DO INSTEAD
--       NOTHING) : retirer l'entrée les perdrait.
-- Une colonne ajoutée depuis prend sa valeur par défaut, et une colonne
-- générée est recalculée par la base : rien n'est perdu. p_contexte (le titre
-- et la table de l'entrée) accompagne chaque refus, pour que l'écran nomme le
-- contenu. Aucun rôle ne peut l'appeler (voir les REVOKE plus bas) : seules
-- les fonctions de la corbeille, qui s'exécutent avec les droits de leur
-- propriétaire, s'en servent.
--
-- La version à deux arguments n'a existé que dans des brouillons de cette
-- migration : la retirer, si un brouillon a été appliqué quelque part.
DROP FUNCTION IF EXISTS public.corbeille_inserer(text, jsonb);

CREATE OR REPLACE FUNCTION public.corbeille_inserer(p_table text, p_lignes jsonb, p_contexte jsonb)
RETURNS integer
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $fonction$
DECLARE
  v_relation regclass;
  v_contexte jsonb := coalesce(p_contexte, '{}'::jsonb) || jsonb_build_object('table_touchee', p_table);
  v_colonnes text;
  v_inconnues text[];
  v_attendues integer;
  v_nombre integer;
BEGIN
  IF p_table IS NULL OR p_table NOT IN (
    'articles', 'education_lessons', 'education_categories', 'strategic_enterprises',
    'legal_sections', 'newsletter_issues', 'learning_path_steps', 'user_lesson_progress',
    'newsletter_events'
  ) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'corbeille:table_inconnue';
  END IF;
  IF p_lignes IS NULL OR jsonb_typeof(p_lignes) <> 'array' OR jsonb_array_length(p_lignes) = 0 THEN
    RETURN 0;
  END IF;
  v_relation := format('public.%I', p_table)::regclass;
  v_attendues := jsonb_array_length(p_lignes);

  IF EXISTS (SELECT 1 FROM jsonb_array_elements(p_lignes) AS e WHERE jsonb_typeof(e) <> 'object') THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'corbeille:copie_illisible', DETAIL = v_contexte::text;
  END IF;

  -- Les clés de la copie qui n'ont plus de colonne dans la table.
  SELECT array_agg(c.cle ORDER BY c.cle)
    INTO v_inconnues
    FROM (SELECT DISTINCT jsonb_object_keys(e) AS cle FROM jsonb_array_elements(p_lignes) AS e) AS c
   WHERE NOT EXISTS (
           SELECT 1
             FROM pg_attribute AS a
            WHERE a.attrelid = v_relation
              AND a.attnum > 0
              AND NOT a.attisdropped
              AND a.attname = c.cle
         );
  IF v_inconnues IS NOT NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'corbeille:colonnes_inconnues',
      DETAIL = (v_contexte || jsonb_build_object('colonnes', to_jsonb(v_inconnues)))::text;
  END IF;

  -- Les colonnes écrites : toutes celles de la copie, sauf les colonnes
  -- générées, que la base recalcule elle-même.
  SELECT string_agg(quote_ident(a.attname), ', ' ORDER BY a.attnum)
    INTO v_colonnes
    FROM pg_attribute AS a
   WHERE a.attrelid = v_relation
     AND a.attnum > 0
     AND NOT a.attisdropped
     AND a.attgenerated = ''
     AND EXISTS (SELECT 1 FROM jsonb_array_elements(p_lignes) AS e WHERE e ? a.attname::text);
  IF v_colonnes IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'corbeille:copie_illisible', DETAIL = v_contexte::text;
  END IF;

  EXECUTE format(
    'INSERT INTO public.%1$I (%2$s) SELECT %2$s FROM jsonb_populate_recordset(NULL::public.%1$I, $1)',
    p_table, v_colonnes
  ) USING p_lignes;
  GET DIAGNOSTICS v_nombre = ROW_COUNT;
  IF v_nombre <> v_attendues THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'corbeille:remise_incomplete',
      DETAIL = (v_contexte || jsonb_build_object('attendues', v_attendues, 'remises', v_nombre))::text;
  END IF;
  RETURN v_nombre;
END;
$fonction$;

CREATE OR REPLACE FUNCTION public.corbeille_mettre(p_table text, p_id uuid, p_par uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET lock_timeout = '5s'
AS $fonction$
DECLARE
  v_contenu jsonb;
  v_dependants jsonb := '{}'::jsonb;
  v_resume jsonb := '{}'::jsonb;
  v_lecteurs uuid[] := '{}';
  v_lecons uuid[] := '{}';
  v_touchees text[];
  v_lignes jsonb;
  v_nombre integer;
  v_inconnues text;
  v_ancienne timestamptz;
  v_titre text;
  v_entree uuid;
  v_supprime_le timestamptz;
BEGIN
  IF p_table IS NULL OR p_table NOT IN (
    'articles', 'education_lessons', 'education_categories', 'strategic_enterprises',
    'legal_sections', 'newsletter_issues'
  ) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'corbeille:table_inconnue';
  END IF;
  IF p_par IS NOT NULL AND NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_par) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'corbeille:auteur_inconnu';
  END IF;

  -- 1. Le contenu, verrouillé jusqu'à la fin de la transaction. Personne ne
  --    peut plus le modifier, ni lui rattacher une ligne : la vérification de
  --    clé étrangère d'une progression ou d'une étape neuve attend ce verrou,
  --    puis échoue puisque le contenu est parti. Rien ne peut donc être
  --    effacé avec lui sans avoir été copié.
  EXECUTE format('SELECT to_jsonb(t) FROM public.%I AS t WHERE t.id = $1 FOR UPDATE', p_table)
    INTO v_contenu
    USING p_id;

  -- 2. Une seule entrée par contenu.
  SELECT supprime_le INTO v_ancienne
    FROM public.contenus_supprimes
   WHERE table_origine = p_table AND id_origine = p_id;
  IF FOUND THEN
    IF v_contenu IS NULL THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'corbeille:deja_dans_la_corbeille';
    END IF;
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'corbeille:copie_existante',
      DETAIL = jsonb_build_object('supprime_le', v_ancienne)::text;
  END IF;
  IF v_contenu IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'corbeille:introuvable';
  END IF;

  -- 3. Un numéro de newsletter parti, ou en train de partir, ne se supprime
  --    pas : ses événements d'envoi seraient perdus, et un numéro restauré en
  --    « sending » pourrait être renvoyé à toute l'audience.
  IF p_table = 'newsletter_issues' THEN
    IF v_contenu ->> 'status' = 'sent' THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'corbeille:numero_envoye';
    END IF;
    IF v_contenu ->> 'status' = 'sending' THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'corbeille:envoi_en_cours';
    END IF;
  END IF;

  -- 4. Filet de sécurité : chaque clé étrangère qui agirait à la suppression
  --    (ON DELETE CASCADE, SET NULL, SET DEFAULT) sur une table que cette
  --    suppression touche doit être l'une de celles que la corbeille sait
  --    garder. Une clé ajoutée plus tard, par exemple de comments vers
  --    articles, fait refuser la suppression au lieu d'effacer en silence.
  v_touchees := CASE p_table
    WHEN 'education_lessons' THEN ARRAY['education_lessons', 'learning_path_steps', 'user_lesson_progress']
    WHEN 'education_categories' THEN ARRAY['education_categories', 'education_lessons', 'learning_path_steps', 'user_lesson_progress']
    WHEN 'newsletter_issues' THEN ARRAY['newsletter_issues', 'newsletter_events']
    ELSE ARRAY[p_table]
  END;
  SELECT string_agg(format('%s.%s (%s)', ns.nspname, cl.relname, c.conname), ', ' ORDER BY ns.nspname, cl.relname, c.conname)
    INTO v_inconnues
    FROM pg_constraint AS c
    JOIN pg_class AS cl ON cl.oid = c.conrelid
    JOIN pg_namespace AS ns ON ns.oid = cl.relnamespace
    JOIN pg_class AS cible ON cible.oid = c.confrelid
    JOIN pg_namespace AS ns_cible ON ns_cible.oid = cible.relnamespace
   WHERE c.contype = 'f'
     AND c.confdeltype IN ('c', 'n', 'd')
     AND ns_cible.nspname = 'public'
     AND cible.relname = ANY (v_touchees)
     AND format(
           '%s.%s(%s)>%s',
           ns.nspname,
           cl.relname,
           (SELECT string_agg(a.attname, ',' ORDER BY a.attnum)
              FROM pg_attribute AS a
             WHERE a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)),
           cible.relname
         ) <> ALL (ARRAY[
           'public.education_lessons(category_id)>education_categories',
           'public.learning_path_steps(lesson_id)>education_lessons',
           'public.user_lesson_progress(lesson_id)>education_lessons',
           'public.newsletter_events(issue_id)>newsletter_issues'
         ]);
  IF v_inconnues IS NOT NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'corbeille:cascade_inconnue', DETAIL = v_inconnues;
  END IF;

  --    Même filet pour ce qu'une clé étrangère ne dit pas : un déclencheur
  --    actif qui réagit à une suppression (DELETE dans son type, bit 8 de
  --    tgtype), ou une règle ON DELETE, sur une table que cette suppression
  --    touche, pourrait effacer ou changer d'autres lignes sans qu'elles
  --    soient copiées. Les déclencheurs internes, ceux des clés étrangères,
  --    relèvent du contrôle précédent ; un déclencheur ou une règle désactivé
  --    ne fait rien.
  SELECT string_agg(x.nom, ', ' ORDER BY x.nom)
    INTO v_inconnues
    FROM (
      SELECT format('déclencheur %s.%s (%s)', ns.nspname, cl.relname, t.tgname) AS nom
        FROM pg_trigger AS t
        JOIN pg_class AS cl ON cl.oid = t.tgrelid
        JOIN pg_namespace AS ns ON ns.oid = cl.relnamespace
       WHERE NOT t.tgisinternal
         AND t.tgenabled <> 'D'
         AND (t.tgtype & 8) <> 0
         AND ns.nspname = 'public'
         AND cl.relname = ANY (v_touchees)
      UNION ALL
      SELECT format('règle %s.%s (%s)', ns.nspname, cl.relname, r.rulename)
        FROM pg_rewrite AS r
        JOIN pg_class AS cl ON cl.oid = r.ev_class
        JOIN pg_namespace AS ns ON ns.oid = cl.relnamespace
       WHERE r.ev_type = '4'
         AND r.ev_enabled <> 'D'
         AND ns.nspname = 'public'
         AND cl.relname = ANY (v_touchees)
    ) AS x;
  IF v_inconnues IS NOT NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'corbeille:declencheur_inconnu', DETAIL = v_inconnues;
  END IF;

  -- 5. Ce que la base effacerait avec le contenu, supprimé ici même avec
  --    RETURNING : la copie est exactement ce qui part. Les leçons d'une
  --    catégorie sont verrouillées d'abord, pour la même raison que le contenu.
  IF p_table = 'education_categories' THEN
    SELECT coalesce(array_agg(l.id ORDER BY l.id), '{}')
      INTO v_lecons
      FROM (SELECT id FROM public.education_lessons WHERE category_id = p_id ORDER BY id FOR UPDATE) AS l;
  ELSIF p_table = 'education_lessons' THEN
    v_lecons := ARRAY[p_id];
  END IF;

  IF cardinality(v_lecons) > 0 THEN
    WITH parties AS (
      DELETE FROM public.user_lesson_progress WHERE lesson_id = ANY (v_lecons) RETURNING *
    )
    SELECT jsonb_agg(to_jsonb(p) ORDER BY p.lesson_id, p.user_id), count(*),
           coalesce(array_agg(DISTINCT p.user_id), '{}')
      INTO v_lignes, v_nombre, v_lecteurs
      FROM parties AS p;
    IF v_nombre > 0 THEN
      v_dependants := v_dependants || jsonb_build_object('user_lesson_progress', v_lignes);
      v_resume := v_resume || jsonb_build_object('user_lesson_progress', v_nombre);
    END IF;

    WITH parties AS (
      DELETE FROM public.learning_path_steps WHERE lesson_id = ANY (v_lecons) RETURNING *
    )
    SELECT jsonb_agg(to_jsonb(p) ORDER BY p.id), count(*)
      INTO v_lignes, v_nombre
      FROM parties AS p;
    IF v_nombre > 0 THEN
      v_dependants := v_dependants || jsonb_build_object('learning_path_steps', v_lignes);
      v_resume := v_resume || jsonb_build_object('learning_path_steps', v_nombre);
    END IF;
  END IF;

  IF p_table = 'education_categories' THEN
    WITH parties AS (
      DELETE FROM public.education_lessons WHERE category_id = p_id RETURNING *
    )
    SELECT jsonb_agg(to_jsonb(p) ORDER BY p.id), count(*)
      INTO v_lignes, v_nombre
      FROM parties AS p;
    IF v_nombre > 0 THEN
      v_dependants := v_dependants || jsonb_build_object('education_lessons', v_lignes);
      v_resume := v_resume || jsonb_build_object('education_lessons', v_nombre);
    END IF;
  END IF;

  IF p_table = 'newsletter_issues' THEN
    -- meta.raw n'est jamais copié : le webhook Resend y recopie l'événement
    -- entier, adresse du destinataire comprise. Seuls resend_id et optimistic,
    -- qui ne disent rien de personne, sont gardés.
    WITH parties AS (
      DELETE FROM public.newsletter_events WHERE issue_id = p_id RETURNING *
    )
    SELECT jsonb_agg(
             to_jsonb(p) || jsonb_build_object(
               'meta',
               CASE
                 WHEN jsonb_typeof(p.meta) = 'object' THEN (
                   SELECT coalesce(jsonb_object_agg(m.cle, m.valeur), '{}'::jsonb)
                     FROM jsonb_each(p.meta) AS m(cle, valeur)
                    WHERE m.cle IN ('resend_id', 'optimistic')
                 )
               END
             )
             ORDER BY p.occurred_at, p.id
           ),
           count(*)
      INTO v_lignes, v_nombre
      FROM parties AS p;
    IF v_nombre > 0 THEN
      v_dependants := v_dependants || jsonb_build_object('newsletter_events', v_lignes);
      v_resume := v_resume || jsonb_build_object('newsletter_events', v_nombre);
    END IF;
  END IF;

  -- 6. Le contenu lui-même : exactement une ligne doit partir.
  EXECUTE format('DELETE FROM public.%I AS t WHERE t.id = $1 RETURNING to_jsonb(t)', p_table)
    INTO v_contenu
    USING p_id;
  GET DIAGNOSTICS v_nombre = ROW_COUNT;
  IF v_nombre <> 1 THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'corbeille:suppression_incoherente';
  END IF;

  v_titre := CASE p_table
    WHEN 'articles' THEN coalesce(nullif(btrim(v_contenu ->> 'title'), ''), 'Article sans titre')
    WHEN 'education_lessons' THEN coalesce(nullif(btrim(v_contenu ->> 'title'), ''), 'Leçon sans titre')
    WHEN 'education_categories' THEN coalesce(nullif(btrim(v_contenu ->> 'title'), ''), 'Catégorie sans titre')
    WHEN 'strategic_enterprises' THEN coalesce(nullif(btrim(v_contenu ->> 'name'), ''), 'Entreprise sans nom')
    WHEN 'legal_sections' THEN concat_ws(
      ' : ',
      CASE v_contenu ->> 'page_slug'
        WHEN 'mentions-legales' THEN 'Mentions légales'
        WHEN 'confidentialite' THEN 'Confidentialité'
        WHEN 'cgu' THEN 'CGU'
        WHEN 'cookies' THEN 'Cookies'
        WHEN 'publicite' THEN 'Publicité'
        WHEN 'about' THEN 'À propos'
        WHEN 'contact' THEN 'Contact'
        ELSE nullif(btrim(v_contenu ->> 'page_slug'), '')
      END,
      coalesce(nullif(btrim(v_contenu ->> 'heading'), ''), 'Section sans titre')
    )
    ELSE 'N°' || chr(160) || (v_contenu ->> 'number') || ' · '
      || coalesce(nullif(btrim(v_contenu ->> 'subject'), ''), 'Numéro sans sujet')
  END;

  -- 7. L'entrée. Écrite dans la même transaction que les suppressions : si
  --    elle échoue, rien n'a été supprimé.
  INSERT INTO public.contenus_supprimes
    (table_origine, id_origine, titre, donnees, dependants, resume_dependants, lecteurs, supprime_par)
  VALUES
    (p_table, p_id, v_titre, v_contenu, v_dependants, v_resume, v_lecteurs, p_par)
  RETURNING id, supprime_le INTO v_entree, v_supprime_le;

  RETURN jsonb_build_object(
    'id_corbeille', v_entree,
    'table', p_table,
    'id_origine', p_id,
    'titre', v_titre,
    'slug', v_contenu -> 'slug',
    'resume', v_resume,
    'supprime_le', v_supprime_le
  );
END;
$fonction$;

CREATE OR REPLACE FUNCTION public.corbeille_restaurer(p_entree uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET lock_timeout = '5s'
AS $fonction$
DECLARE
  v_entree public.contenus_supprimes%ROWTYPE;
  v_table text;
  v_ligne jsonb;
  v_contexte jsonb;
  v_colonne_titre text;
  v_remarques jsonb := '[]'::jsonb;
  v_remis jsonb := '{}'::jsonb;
  v_autre text;
  v_existe boolean;
  v_lignes jsonb;
  v_gardees jsonb;
  v_nombre integer;
  v_ecartees integer;
  v_categorie uuid;
  v_renumeroter boolean := false;
  v_jamais_envoye boolean;
  v_ancien_numero integer;
  v_numero integer;
  v_queue text;
  v_slug text;
BEGIN
  -- L'entrée, verrouillée : deux restaurations simultanées de la même entrée
  -- (un double clic) ne peuvent pas la remettre deux fois. La seconde attend,
  -- puis ne la trouve plus.
  SELECT * INTO v_entree FROM public.contenus_supprimes WHERE id = p_entree FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'corbeille:entree_introuvable';
  END IF;
  v_table := v_entree.table_origine;
  v_ligne := v_entree.donnees;
  v_colonne_titre := CASE v_table WHEN 'strategic_enterprises' THEN 'name' ELSE 'title' END;
  -- Chaque refus dit de quoi il s'agit : l'écran nomme le contenu.
  v_contexte := jsonb_build_object('titre', v_entree.titre, 'table', v_table);

  -- 1. Le même identifiant ne doit pas être déjà en place.
  EXECUTE format('SELECT EXISTS (SELECT 1 FROM public.%I WHERE id = $1)', v_table)
    INTO v_existe
    USING v_entree.id_origine;
  IF v_existe THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'corbeille:id_pris', DETAIL = v_contexte::text;
  END IF;

  -- 2. Une leçon a besoin de sa catégorie. Le verrou empêche qu'elle parte
  --    pendant la restauration.
  IF v_table = 'education_lessons' THEN
    v_categorie := CASE WHEN pg_input_is_valid(v_ligne ->> 'category_id', 'uuid')
                        THEN (v_ligne ->> 'category_id')::uuid END;
    PERFORM 1 FROM public.education_categories WHERE id = v_categorie FOR KEY SHARE;
    IF NOT FOUND THEN
      SELECT titre INTO v_autre
        FROM public.contenus_supprimes
       WHERE table_origine = 'education_categories' AND id_origine = v_categorie;
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'corbeille:categorie_absente',
        DETAIL = (v_contexte || jsonb_build_object('categorie_en_corbeille', v_autre IS NOT NULL, 'categorie', v_autre))::text;
    END IF;
  END IF;

  -- 3. Un lien (slug) déjà pris par un autre contenu : refus, rien n'est écrit.
  IF v_table IN ('articles', 'education_categories', 'strategic_enterprises')
     AND nullif(v_ligne ->> 'slug', '') IS NOT NULL THEN
    EXECUTE format('SELECT %I FROM public.%I WHERE slug = $1 LIMIT 1', v_colonne_titre, v_table)
      INTO v_autre
      USING v_ligne ->> 'slug';
    GET DIAGNOSTICS v_nombre = ROW_COUNT;
    IF v_nombre > 0 THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'corbeille:slug_pris',
        DETAIL = (v_contexte || jsonb_build_object('slug', v_ligne ->> 'slug', 'autre', v_autre))::text;
    END IF;
  END IF;

  -- 4. Newsletter. Un numéro programmé, ou dont l'envoi était en cours,
  --    revient en brouillon : la tâche planifiée enverrait sinon à toute
  --    l'audience un numéro programmé resté en corbeille au-delà de son
  --    heure. Un numéro ou un lien repris entre-temps : un brouillon jamais
  --    envoyé n'a pas de numéro public, il en reçoit un neuf (attribué par le
  --    déclencheur, comme à la création) et un lien recalculé ; un numéro déjà
  --    parti, même en partie, ne change pas de numéro.
  IF v_table = 'newsletter_issues' THEN
    IF v_ligne ->> 'status' = 'scheduled' THEN
      v_ligne := jsonb_set(v_ligne, '{status}', '"draft"');
      v_remarques := v_remarques || jsonb_build_array(jsonb_build_object('code', 'programme_en_brouillon'));
    ELSIF v_ligne ->> 'status' = 'sending' THEN
      v_ligne := jsonb_set(v_ligne, '{status}', '"draft"');
      v_remarques := v_remarques || jsonb_build_array(jsonb_build_object('code', 'envoi_interrompu_en_brouillon'));
    END IF;

    v_jamais_envoye := coalesce(v_entree.donnees ->> 'status', '') IN ('draft', 'scheduled', 'cancelled')
      AND nullif(v_ligne ->> 'sent_at', '') IS NULL
      AND coalesce(v_ligne ->> 'recipients_count', '0') = '0'
      AND coalesce(v_ligne ->> 'delivered_count', '0') = '0'
      AND NOT (v_entree.dependants ? 'newsletter_events');

    SELECT subject INTO v_autre
      FROM public.newsletter_issues
     WHERE number::text = v_ligne ->> 'number' OR slug = v_ligne ->> 'slug'
     ORDER BY (number::text = v_ligne ->> 'number') DESC
     LIMIT 1;
    IF FOUND THEN
      IF NOT v_jamais_envoye THEN
        RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'corbeille:numero_pris',
          DETAIL = (v_contexte || jsonb_build_object('numero', v_ligne -> 'number', 'slug', v_ligne ->> 'slug', 'autre', v_autre))::text;
      END IF;
      v_renumeroter := true;
      v_ancien_numero := (v_ligne ->> 'number')::integer;
      -- Numéro vide : le déclencheur newsletter_issues_assign_number en
      -- attribue un neuf. Le lien provisoire, unique par construction, est
      -- remplacé juste après, quand le numéro est connu.
      v_ligne := jsonb_set(
        jsonb_set(v_ligne, '{number}', 'null'::jsonb),
        '{slug}',
        to_jsonb('restauration-' || v_entree.id::text)
      );
    END IF;
  END IF;

  -- 5. « À la une » : un seul contenu à la fois. Remettre un contenu qui
  --    l'était ne détrône pas celui que l'équipe a choisi depuis.
  IF v_table IN ('articles', 'strategic_enterprises') AND v_ligne ->> 'is_featured' = 'true' THEN
    EXECUTE format('SELECT %I FROM public.%I WHERE is_featured LIMIT 1', v_colonne_titre, v_table)
      INTO v_autre;
    GET DIAGNOSTICS v_nombre = ROW_COUNT;
    IF v_nombre > 0 THEN
      v_ligne := jsonb_set(v_ligne, '{is_featured}', 'false'::jsonb);
      v_remarques := v_remarques || jsonb_build_array(jsonb_build_object('code', 'a_la_une_retiree', 'autre', v_autre));
    END IF;
  END IF;

  -- 6. Le contenu : exactement une ligne doit revenir. corbeille_inserer le
  --    vérifie déjà ; le redire ici protège la règle si elle venait à changer.
  v_nombre := public.corbeille_inserer(v_table, jsonb_build_array(v_ligne), v_contexte);
  IF v_nombre IS DISTINCT FROM 1 THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'corbeille:remise_incomplete',
      DETAIL = (v_contexte || jsonb_build_object('table_touchee', v_table, 'attendues', 1, 'remises', v_nombre))::text;
  END IF;

  IF v_renumeroter THEN
    SELECT number INTO v_numero FROM public.newsletter_issues WHERE id = v_entree.id_origine;
    -- Même calcul que autoSlug (src/lib/newsletter/issues.ts) : « 012-or-brvm »,
    -- numéro sur trois chiffres, puis les quatre premiers mots du sujet, en
    -- minuscules et sans accents.
    v_queue := array_to_string(
      (regexp_split_to_array(
        btrim(
          regexp_replace(
            lower(regexp_replace(normalize(coalesce(v_ligne ->> 'subject', ''), NFD), '[\u0300-\u036f]', '', 'g')),
            '[^a-z0-9]+', '-', 'g'
          ),
          '-'
        ),
        '-'
      ))[1:4],
      '-'
    );
    v_slug := CASE WHEN length(v_numero::text) >= 3 THEN v_numero::text ELSE lpad(v_numero::text, 3, '0') END
      || CASE WHEN v_queue <> '' THEN '-' || v_queue ELSE '' END;
    IF EXISTS (SELECT 1 FROM public.newsletter_issues WHERE slug = v_slug AND id <> v_entree.id_origine) THEN
      v_slug := v_slug || '-' || left(v_entree.id_origine::text, 8);
    END IF;
    -- Le contenu de l'e-mail porte aussi son numéro et son lien (« Édition
    -- n°12 ») : ils suivent.
    UPDATE public.newsletter_issues
       SET slug = v_slug,
           content = CASE
             WHEN jsonb_typeof(content) = 'object' THEN
               content
               || CASE WHEN content ? 'number' THEN jsonb_build_object('number', v_numero) ELSE '{}'::jsonb END
               || CASE WHEN content ? 'slug' THEN jsonb_build_object('slug', v_slug) ELSE '{}'::jsonb END
             ELSE content
           END
     WHERE id = v_entree.id_origine;
    v_remarques := v_remarques || jsonb_build_array(jsonb_build_object(
      'code', 'numero_change', 'ancien', v_ancien_numero, 'nouveau', v_numero, 'autre', v_autre
    ));
    v_ligne := jsonb_set(v_ligne, '{slug}', to_jsonb(v_slug));
  END IF;

  -- 7. Ce qui en dépend, parents d'abord.
  v_nombre := public.corbeille_inserer('education_lessons', v_entree.dependants -> 'education_lessons', v_contexte);
  IF v_nombre > 0 THEN
    v_remis := v_remis || jsonb_build_object('education_lessons', v_nombre);
  END IF;

  -- Étapes de parcours : celles d'un parcours supprimé entre-temps ne
  -- reviennent pas, la base les aurait effacées avec lui.
  v_lignes := coalesce(v_entree.dependants -> 'learning_path_steps', '[]'::jsonb);
  IF jsonb_array_length(v_lignes) > 0 THEN
    PERFORM 1
       FROM public.learning_paths AS p
      WHERE p.id IN (
              SELECT CASE WHEN pg_input_is_valid(e ->> 'path_id', 'uuid') THEN (e ->> 'path_id')::uuid END
                FROM jsonb_array_elements(v_lignes) AS e
            )
      ORDER BY p.id
        FOR KEY SHARE;
    SELECT coalesce(jsonb_agg(x.e ORDER BY x.o), '[]'::jsonb)
      INTO v_gardees
      FROM jsonb_array_elements(v_lignes) WITH ORDINALITY AS x(e, o)
     WHERE EXISTS (
             SELECT 1 FROM public.learning_paths AS p
              WHERE p.id = CASE WHEN pg_input_is_valid(x.e ->> 'path_id', 'uuid') THEN (x.e ->> 'path_id')::uuid END
           );
    v_ecartees := jsonb_array_length(v_lignes) - jsonb_array_length(v_gardees);
    IF v_ecartees > 0 THEN
      v_remarques := v_remarques || jsonb_build_array(jsonb_build_object('code', 'etapes_ecartees', 'nombre', v_ecartees));
    END IF;
    v_nombre := public.corbeille_inserer('learning_path_steps', v_gardees, v_contexte);
    IF v_nombre > 0 THEN
      v_remis := v_remis || jsonb_build_object('learning_path_steps', v_nombre);
    END IF;
  END IF;

  -- Progression des lecteurs : seulement ceux dont le compte existe encore,
  -- dans auth.users, la vraie cible de la clé étrangère. L'effacement demandé
  -- par un lecteur vaut aussi pour sa copie. Le verrou empêche que son compte
  -- disparaisse pendant la restauration sans emporter ce qui vient d'être remis.
  v_lignes := coalesce(v_entree.dependants -> 'user_lesson_progress', '[]'::jsonb);
  IF jsonb_array_length(v_lignes) > 0 THEN
    PERFORM 1
       FROM auth.users AS u
      WHERE u.id IN (
              SELECT CASE WHEN pg_input_is_valid(e ->> 'user_id', 'uuid') THEN (e ->> 'user_id')::uuid END
                FROM jsonb_array_elements(v_lignes) AS e
            )
      ORDER BY u.id
        FOR KEY SHARE;
    SELECT coalesce(jsonb_agg(x.e ORDER BY x.o), '[]'::jsonb)
      INTO v_gardees
      FROM jsonb_array_elements(v_lignes) WITH ORDINALITY AS x(e, o)
     WHERE EXISTS (
             SELECT 1 FROM auth.users AS u
              WHERE u.id = CASE WHEN pg_input_is_valid(x.e ->> 'user_id', 'uuid') THEN (x.e ->> 'user_id')::uuid END
                AND u.deleted_at IS NULL
           );
    v_ecartees := jsonb_array_length(v_lignes) - jsonb_array_length(v_gardees);
    IF v_ecartees > 0 THEN
      v_remarques := v_remarques || jsonb_build_array(jsonb_build_object('code', 'progressions_ecartees', 'nombre', v_ecartees));
    END IF;
    v_nombre := public.corbeille_inserer('user_lesson_progress', v_gardees, v_contexte);
    IF v_nombre > 0 THEN
      v_remis := v_remis || jsonb_build_object('user_lesson_progress', v_nombre);
    END IF;
  END IF;

  -- Événements d'envoi : sans leur abonné quand il a été supprimé
  -- entre-temps, la base aurait vidé la colonne (ON DELETE SET NULL).
  v_lignes := coalesce(v_entree.dependants -> 'newsletter_events', '[]'::jsonb);
  IF jsonb_array_length(v_lignes) > 0 THEN
    PERFORM 1
       FROM public.newsletter_subscribers AS s
      WHERE s.id IN (
              SELECT CASE WHEN pg_input_is_valid(e ->> 'subscriber_id', 'uuid') THEN (e ->> 'subscriber_id')::uuid END
                FROM jsonb_array_elements(v_lignes) AS e
            )
      ORDER BY s.id
        FOR KEY SHARE;
    SELECT coalesce(jsonb_agg(
             CASE
               WHEN x.e ->> 'subscriber_id' IS NULL OR EXISTS (
                 SELECT 1 FROM public.newsletter_subscribers AS s
                  WHERE s.id = CASE WHEN pg_input_is_valid(x.e ->> 'subscriber_id', 'uuid') THEN (x.e ->> 'subscriber_id')::uuid END
               ) THEN x.e
               ELSE jsonb_set(x.e, '{subscriber_id}', 'null'::jsonb)
             END
             ORDER BY x.o
           ), '[]'::jsonb),
           count(*) FILTER (
             WHERE x.e ->> 'subscriber_id' IS NOT NULL AND NOT EXISTS (
               SELECT 1 FROM public.newsletter_subscribers AS s
                WHERE s.id = CASE WHEN pg_input_is_valid(x.e ->> 'subscriber_id', 'uuid') THEN (x.e ->> 'subscriber_id')::uuid END
             )
           )
      INTO v_gardees, v_ecartees
      FROM jsonb_array_elements(v_lignes) WITH ORDINALITY AS x(e, o);
    IF v_ecartees > 0 THEN
      v_remarques := v_remarques || jsonb_build_array(jsonb_build_object('code', 'abonnes_vides', 'nombre', v_ecartees));
    END IF;
    v_nombre := public.corbeille_inserer('newsletter_events', v_gardees, v_contexte);
    IF v_nombre > 0 THEN
      v_remis := v_remis || jsonb_build_object('newsletter_events', v_nombre);
    END IF;
  END IF;

  -- 8. Tout est revenu, dans la même transaction : l'entrée quitte la corbeille.
  DELETE FROM public.contenus_supprimes WHERE id = p_entree;

  RETURN jsonb_build_object(
    'table', v_table,
    'id_origine', v_entree.id_origine,
    'titre', v_entree.titre,
    'slug', v_ligne -> 'slug',
    'remis', v_remis,
    'remarques', v_remarques
  );
END;
$fonction$;

CREATE OR REPLACE FUNCTION public.corbeille_retirer_lecteur(p_user uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET lock_timeout = '5s'
AS $fonction$
DECLARE
  v_entrees integer;
  v_lignes integer;
BEGIN
  IF p_user IS NULL THEN
    RETURN jsonb_build_object('entrees', 0, 'lignes', 0);
  END IF;
  -- Les verrous sont pris en une instruction, dans l'ordre des identifiants,
  -- comme dans corbeille_purger, qui verrouille d'un coup tout ce qu'elle
  -- touche : deux nettoyages simultanés peuvent s'attendre, jamais
  -- s'interbloquer. Une restauration en cours sur une de ces entrées passe
  -- d'abord ; l'entrée n'existe alors plus, et la progression remise est
  -- effacée avec le compte, par la clé étrangère.
  PERFORM 1 FROM public.contenus_supprimes WHERE lecteurs @> ARRAY[p_user] ORDER BY id FOR UPDATE;

  WITH avant AS (
    SELECT c.id,
           (SELECT jsonb_agg(x.l ORDER BY x.o)
              FROM jsonb_array_elements(coalesce(c.dependants -> 'user_lesson_progress', '[]'::jsonb))
                   WITH ORDINALITY AS x(l, o)
             WHERE x.l ->> 'user_id' IS DISTINCT FROM p_user::text) AS reste,
           jsonb_array_length(coalesce(c.dependants -> 'user_lesson_progress', '[]'::jsonb)) AS nombre_avant
      FROM public.contenus_supprimes AS c
     WHERE c.lecteurs @> ARRAY[p_user]
  ), nettoyees AS (
    UPDATE public.contenus_supprimes AS c
       SET dependants = CASE WHEN a.reste IS NULL THEN c.dependants - 'user_lesson_progress'
                             ELSE jsonb_set(c.dependants, '{user_lesson_progress}', a.reste) END,
           resume_dependants = CASE WHEN a.reste IS NULL THEN c.resume_dependants - 'user_lesson_progress'
                                    ELSE jsonb_set(c.resume_dependants, '{user_lesson_progress}', to_jsonb(jsonb_array_length(a.reste))) END,
           lecteurs = array_remove(c.lecteurs, p_user)
      FROM avant AS a
     WHERE c.id = a.id
    RETURNING a.nombre_avant - coalesce(jsonb_array_length(a.reste), 0) AS retirees
  )
  SELECT count(*), coalesce(sum(retirees), 0) INTO v_entrees, v_lignes FROM nettoyees;

  RETURN jsonb_build_object('entrees', v_entrees, 'lignes', v_lignes);
END;
$fonction$;

-- Fonction interne : l'instant avant lequel une entrée a fait son temps.
-- Chaque entrée reste récupérable jusqu'à la fin du jour que l'écran affiche :
-- le jour de sa mise à la corbeille plus p_jours, en date de Niamey
-- (Africa/Niamey, UTC+1 toute l'année), là où sont l'équipe et la tâche de
-- nuit. Elle n'est donc purgée qu'à partir du lendemain de ce jour, à minuit,
-- heure de Niamey : la limite est minuit, heure de Niamey, du jour
-- « aujourd'hui à Niamey moins p_jours ». Exemple : une entrée mise à la
-- corbeille le 3 novembre à 1 h 30 est affichée « récupérable jusqu'au
-- 3 décembre inclus » ; la tâche de 3 h du 3 décembre la garde, et toute
-- ouverture de la corbeille ce jour-là aussi ; elle part à partir du 4 à
-- minuit. p_instant est un paramètre pour que les tests rejouent n'importe
-- quel moment ; corbeille_purger lui passe toujours now().
CREATE OR REPLACE FUNCTION public.corbeille_limite_purge(p_jours integer, p_instant timestamptz)
RETURNS timestamptz
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $fonction$
  SELECT (((p_instant AT TIME ZONE 'Africa/Niamey')::date - p_jours)::timestamp) AT TIME ZONE 'Africa/Niamey'
$fonction$;

CREATE OR REPLACE FUNCTION public.corbeille_purger(p_jours integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET lock_timeout = '5s'
AS $fonction$
DECLARE
  v_limite timestamptz;
  v_purgees jsonb;
  v_orphelins uuid[];
  v_lecteur uuid;
  v_retires integer := 0;
BEGIN
  -- Trente jours au moins : c'est la durée annoncée à l'écran. Une erreur
  -- d'appel (0, null, un nombre négatif) ne peut pas vider la corbeille, et
  -- une durée absurde (plus de dix ans) est refusée au lieu de faire échouer
  -- le calcul des dates.
  IF p_jours IS NULL OR p_jours < 30 OR p_jours > 3650 THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'corbeille:duree_invalide';
  END IF;
  v_limite := public.corbeille_limite_purge(p_jours, now());

  -- 1. Les lecteurs dont le compte n'existe plus. La suppression d'un compte
  --    retire déjà leurs lignes ; ceci rattrape un nettoyage qui aurait
  --    échoué. Calculés AVANT tout verrou, pour tout verrouiller en une fois.
  SELECT coalesce(array_agg(DISTINCT l ORDER BY l), '{}')
    INTO v_orphelins
    FROM public.contenus_supprimes AS c
   CROSS JOIN LATERAL unnest(c.lecteurs) AS l
   WHERE NOT EXISTS (SELECT 1 FROM auth.users AS u WHERE u.id = l AND u.deleted_at IS NULL);

  -- 2. Tout ce que la purge va toucher, verrouillé en UNE instruction, dans
  --    l'ordre des identifiants : les entrées dont le temps est passé ET
  --    celles des lecteurs disparus. corbeille_retirer_lecteur verrouille dans
  --    le même ordre : deux nettoyages qui se croisent s'attendent, sans
  --    jamais s'interbloquer. Verrouiller en deux passes, comme avant, faisait
  --    échouer l'un des deux en 40P01 quand un compte était supprimé pendant
  --    la purge.
  PERFORM 1
     FROM public.contenus_supprimes
    WHERE supprime_le < v_limite OR lecteurs && v_orphelins
    ORDER BY id
      FOR UPDATE;

  -- 3. Les entrées dont le dernier jour récupérable est passé.
  WITH parties AS (
    DELETE FROM public.contenus_supprimes
     WHERE supprime_le < v_limite
    RETURNING table_origine, id_origine, supprime_le, resume_dependants
  )
  SELECT coalesce(jsonb_agg(jsonb_build_object(
           'table', table_origine,
           'id_origine', id_origine,
           'supprime_le', supprime_le,
           'dependants', resume_dependants
         ) ORDER BY supprime_le, id_origine), '[]'::jsonb)
    INTO v_purgees
    FROM parties;

  -- 4. Les lignes des lecteurs disparus, dans les entrées qui restent.
  FOREACH v_lecteur IN ARRAY v_orphelins LOOP
    IF (public.corbeille_retirer_lecteur(v_lecteur) ->> 'entrees')::integer > 0 THEN
      v_retires := v_retires + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'duree_jours', p_jours,
    'purgees', v_purgees,
    'lecteurs_retires', v_retires
  );
END;
$fonction$;

-- Les droits par défaut du schéma public donnent EXECUTE à PUBLIC, anon et
-- authenticated sur chaque fonction neuve : sans ces REVOKE, n'importe quel
-- visiteur pourrait vider ou restaurer la corbeille avec la clé publique.
REVOKE ALL ON FUNCTION public.corbeille_inserer(text, jsonb, jsonb) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.corbeille_limite_purge(integer, timestamptz) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.corbeille_mettre(text, uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.corbeille_restaurer(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.corbeille_retirer_lecteur(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.corbeille_purger(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.corbeille_mettre(text, uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.corbeille_restaurer(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.corbeille_retirer_lecteur(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.corbeille_purger(integer) TO service_role;

COMMENT ON TABLE public.contenus_supprimes IS
  'Corbeille : copie d''un contenu supprimé et de ce que la base a effacé avec lui. Une entrée par contenu, gardée jusqu''au soir du trentième jour, heure de Niamey. Écrite uniquement par les fonctions corbeille_* ; lisible par la seule clé de service.';
COMMENT ON COLUMN public.contenus_supprimes.dependants IS
  'Lignes que la base efface avec le contenu, par table. Les commentaires et j''aime d''un article n''en font pas partie : en production, ils survivent à l''article.';
COMMENT ON COLUMN public.contenus_supprimes.lecteurs IS
  'Comptes de lecteurs présents dans dependants : leurs lignes sont retirées quand ils suppriment leur compte.';
COMMENT ON FUNCTION public.corbeille_mettre(text, uuid, uuid) IS
  'Met un contenu à la corbeille, avec ce que la base efface avec lui, en une transaction. service_role uniquement.';
COMMENT ON FUNCTION public.corbeille_restaurer(uuid) IS
  'Remet un contenu et tout ce qui en dépend, ou rien, puis retire l''entrée. service_role uniquement.';
COMMENT ON FUNCTION public.corbeille_retirer_lecteur(uuid) IS
  'Retire les lignes d''un lecteur de toutes les entrées de la corbeille, en une instruction. service_role uniquement.';
COMMENT ON FUNCTION public.corbeille_purger(integer) IS
  'Supprime les entrées dont le dernier jour récupérable (jour de la suppression plus N jours, 30 au minimum, en date de Niamey) est passé, et les lignes des lecteurs disparus. service_role uniquement.';
COMMENT ON FUNCTION public.corbeille_limite_purge(integer, timestamptz) IS
  'Interne à la corbeille : minuit, heure de Niamey, du jour (date de Niamey de p_instant) - p_jours. Une entrée antérieure a fait son temps.';
COMMENT ON FUNCTION public.corbeille_inserer(text, jsonb, jsonb) IS
  'Interne à la corbeille : aucun rôle ne peut l''appeler directement.';

COMMIT;

-- ---------------------------------------------------------------------------
-- VÉRIFICATIONS, à lancer APRÈS l'application (lecture seule).
--
-- select
--   has_table_privilege('anon', 'public.contenus_supprimes',
--     'select, insert, update, delete, truncate, references, trigger')     as anon,              -- false
--   has_table_privilege('authenticated', 'public.contenus_supprimes',
--     'select, insert, update, delete, truncate, references, trigger')     as authenticated,     -- false
--   has_table_privilege('service_role', 'public.contenus_supprimes', 'select') as service_lit,   -- true
--   has_table_privilege('service_role', 'public.contenus_supprimes', 'delete') as service_vide,  -- true
--   has_table_privilege('service_role', 'public.contenus_supprimes',
--     'insert, update, truncate')                                          as service_ecrit,     -- false
--   (select relrowsecurity from pg_class
--     where oid = 'public.contenus_supprimes'::regclass)                   as rls,               -- true
--   (select count(*) from pg_policies
--     where schemaname = 'public' and tablename = 'contenus_supprimes')    as politiques;        -- 0
--
-- select f, r, has_function_privilege(r, f, 'execute') as peut
--   from unnest(array[
--          'public.corbeille_mettre(text, uuid, uuid)',
--          'public.corbeille_restaurer(uuid)',
--          'public.corbeille_retirer_lecteur(uuid)',
--          'public.corbeille_purger(integer)',
--          'public.corbeille_inserer(text, jsonb, jsonb)',
--          'public.corbeille_limite_purge(integer, timestamptz)']) as f,
--        unnest(array['anon', 'authenticated', 'service_role']) as r
--  order by f, r;
-- Attendu : peut = false pour anon et authenticated sur les six fonctions ;
-- true pour service_role sur les quatre premières ; false pour service_role
-- sur corbeille_inserer et corbeille_limite_purge (fonctions internes).
--
-- select proname, prosecdef, proconfig from pg_proc
--  where pronamespace = 'public'::regnamespace and proname like 'corbeille%'
--  order by proname;
-- Attendu : prosecdef = true pour les quatre fonctions publiques, avec
-- proconfig = {"search_path=public, pg_temp",lock_timeout=5s} ; pour
-- corbeille_inserer et corbeille_limite_purge, prosecdef = false et
-- proconfig = {"search_path=public, pg_temp"}.
--
-- ---------------------------------------------------------------------------
-- RETOUR ARRIÈRE (à ne faire qu'en connaissance de cause).
--
-- 1. D'abord le code : les routes de suppression appellent corbeille_mettre.
--    Sans la fonction, toute suppression de contenu est refusée (rien n'est
--    perdu, mais plus rien ne se supprime) : revenir au code d'avant AVANT de
--    retirer la base.
-- 2. ATTENTION : « DROP TABLE public.contenus_supprimes » efface
--    DÉFINITIVEMENT tout ce qui est dans la corbeille à ce moment-là : chaque
--    contenu qui s'y trouve est alors perdu pour de bon, sans autre copie que
--    la sauvegarde de la nuit. Remettre en place ce qui doit l'être, ou en
--    garder une copie (select * from public.contenus_supprimes), avant :
--
-- BEGIN;
-- DROP FUNCTION IF EXISTS public.corbeille_purger(integer);
-- DROP FUNCTION IF EXISTS public.corbeille_limite_purge(integer, timestamptz);
-- DROP FUNCTION IF EXISTS public.corbeille_retirer_lecteur(uuid);
-- DROP FUNCTION IF EXISTS public.corbeille_restaurer(uuid);
-- DROP FUNCTION IF EXISTS public.corbeille_mettre(text, uuid, uuid);
-- DROP FUNCTION IF EXISTS public.corbeille_inserer(text, jsonb, jsonb);
-- DROP TABLE IF EXISTS public.contenus_supprimes;
-- COMMIT;

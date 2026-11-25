-- 00035 : Apprendre devient des cours publiés leçon par leçon (25/11/2026).
--
-- Décisions de Raouf du 25/11/2026 : un premier cours complet au lancement,
-- puis une leçon par semaine ; les parcours sont fondus dans les cours ; une
-- page par leçon ; une question de fin pour vérifier ce qu'on a compris.
--
-- Trois colonnes, toutes facultatives, rien n'est supprimé ni réécrit :
--   - slug         : l'adresse de la leçon dans son cours (/apprendre/<cours>/<slug>).
--   - published_at : date de publication. Vide, la leçon reste en base, cachée
--                    au public. Une date future la publie seule à cette date,
--                    sans intervention (le site doit marcher sans personne).
--   - quiz         : la ou les questions de fin, en tableau JSON
--                    [{ "question", "choix": [...], "bonne": <indice>, "explication" }].
--
-- Droits : comme le contenu (voir 00031), ces colonnes ne sont PAS accordées
-- aux rôles publics. Le site les lit avec la clé de service, côté serveur, et
-- les réponses du quiz ne sortent jamais par la clé publique.

ALTER TABLE public.education_lessons
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS quiz jsonb;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'education_lessons_slug_format') THEN
    ALTER TABLE public.education_lessons
      ADD CONSTRAINT education_lessons_slug_format
      CHECK (slug IS NULL OR slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'education_lessons_quiz_tableau') THEN
    ALTER TABLE public.education_lessons
      ADD CONSTRAINT education_lessons_quiz_tableau
      CHECK (quiz IS NULL OR jsonb_typeof(quiz) = 'array');
  END IF;
END $$;

-- Une adresse par leçon à l'intérieur d'un cours.
CREATE UNIQUE INDEX IF NOT EXISTS education_lessons_cours_slug_unique
  ON public.education_lessons (category_id, slug)
  WHERE slug IS NOT NULL;

-- Les pages publiques ne lisent que les leçons publiées.
CREATE INDEX IF NOT EXISTS idx_education_lessons_published_at
  ON public.education_lessons (published_at)
  WHERE published_at IS NOT NULL;

COMMENT ON COLUMN public.education_lessons.slug IS
  'Adresse de la leçon dans son cours : /apprendre/<cours>/<slug>. Minuscules, chiffres et tirets.';
COMMENT ON COLUMN public.education_lessons.published_at IS
  'Date de publication. Vide : leçon cachée au public. Date future : publiée seule à cette date.';
COMMENT ON COLUMN public.education_lessons.quiz IS
  'Questions de fin : [{question, choix[], bonne, explication}]. Lisible par la seule clé de service.';

-- Une leçon cachée ne se lit pas non plus par la clé publique : la lecture
-- publique (titres, ordre, niveau d'accès) ne voit que les leçons publiées.
-- Le site lit tout avec la clé de service, l'administration aussi.
DROP POLICY IF EXISTS "Public read education_lessons" ON public.education_lessons;
CREATE POLICY "Public read education_lessons" ON public.education_lessons
  FOR SELECT USING (published_at IS NOT NULL AND published_at <= now());

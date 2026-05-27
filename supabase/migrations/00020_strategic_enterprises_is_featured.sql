-- Ajoute la colonne is_featured pour designer l'entreprise vedette de l'atlas
-- /entreprises. Une seule entreprise peut etre marquee vedette a la fois,
-- garanti par un index unique partiel.
--
-- Cette colonne alimente getFeaturedEnterprise() dans src/lib/strategic-enterprises.ts.
-- Tant qu'elle n'existe pas, le helper fallback sur la premiere entreprise
-- par display_order.

ALTER TABLE public.strategic_enterprises
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

-- Index unique partiel : autorise un seul row avec is_featured=true.
-- Postgres ignore les rows ou is_featured=false (donc N=7 par defaut).
CREATE UNIQUE INDEX IF NOT EXISTS strategic_enterprises_only_one_featured
  ON public.strategic_enterprises (is_featured)
  WHERE is_featured = true;

COMMENT ON COLUMN public.strategic_enterprises.is_featured IS
  'Designe l''entreprise vedette de l''atlas /entreprises. Une seule a la fois (index unique partiel). Geree depuis l''admin StrategicEnterprisesManager.';

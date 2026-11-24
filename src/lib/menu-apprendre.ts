import { unstable_cache } from 'next/cache';
import { createServiceClient } from '@/lib/supabase';
import { formatDifficulty } from '@/lib/difficulty-label';
import { MENU_APPRENDRE_VIDE, type MenuApprendre } from '@/lib/navigation';

export { MENU_APPRENDRE_VIDE, type MenuApprendre };

/**
 * La liste déroulante « Apprendre » du menu : les parcours et les thèmes tels
 * qu'ils sont en base, pour que le menu suive seul ce que l'admin ajoute,
 * renomme ou masque (le site doit marcher sans personne pour le tenir à jour).
 *
 * Lu côté serveur uniquement (clé de service), dans le layout racine, et
 * seulement quand le menu du site s'affiche. Mis en cache une heure ; en cas
 * de panne, le menu garde son lien « Tout Apprendre » et rien d'autre.
 */
export const getMenuApprendre = unstable_cache(
  async (): Promise<MenuApprendre> => {
    const supabase = createServiceClient();
    if (!supabase) return MENU_APPRENDRE_VIDE;
    try {
      const [parcours, themes] = await Promise.all([
        supabase
          .from('learning_paths')
          .select('slug, title, difficulty')
          .eq('available', true)
          .order('sort_order'),
        supabase
          .from('education_categories')
          .select('slug, title, education_lessons(id)')
          .eq('available', true)
          .order('sort_order'),
      ]);
      if (parcours.error || themes.error) return MENU_APPRENDRE_VIDE;
      return {
        parcours: (parcours.data ?? []).map((p) => ({
          href: `/education/parcours/${p.slug}`,
          label: p.title,
          detail: p.difficulty ? formatDifficulty(p.difficulty) : undefined,
        })),
        themes: (themes.data ?? []).map((t) => ({ href: `/education/${t.slug}`, label: t.title })),
        lecons: (themes.data ?? []).reduce(
          (total, t) => total + (Array.isArray(t.education_lessons) ? t.education_lessons.length : 0),
          0,
        ),
      };
    } catch {
      return MENU_APPRENDRE_VIDE;
    }
  },
  // v2 le 24/11/2026 : les titres des thèmes ont été corrigés en base, la
  // nouvelle clé force leur relecture sans attendre l'heure de cache.
  ['menu-apprendre-v2'],
  { revalidate: 3600, tags: ['menu-apprendre'] },
);

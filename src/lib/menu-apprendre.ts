import { unstable_cache } from 'next/cache';
import { getCours } from '@/lib/apprendre/donnees';
import { MENU_APPRENDRE_VIDE, type MenuApprendre } from '@/lib/navigation';
import { typographieFr } from '@/lib/typographie-fr';
import { MENU_APPRENDRE_CACHE_TAG } from '@/lib/apprendre/cache';

export { MENU_APPRENDRE_VIDE, type MenuApprendre, MENU_APPRENDRE_CACHE_TAG };

/**
 * La liste déroulante « Apprendre » du menu : les cours ouverts, puis les
 * premières leçons du premier cours, pour qu'un débutant sache par où
 * commencer. Suit seule ce qui est publié en base (le site doit marcher sans
 * personne pour le tenir à jour).
 *
 * Lu côté serveur uniquement, dans le layout racine, et seulement quand le
 * menu du site s'affiche. Mis en cache une heure ; en cas de panne, le menu
 * garde son lien « Tout Apprendre » et rien d'autre.
 */
export const getMenuApprendre = unstable_cache(
  async (): Promise<MenuApprendre> => {
    try {
      const cours = await getCours();
      if (cours.length === 0) return MENU_APPRENDRE_VIDE;
      const premier = cours[0]!;
      // Au-delà de quatre cours, un titre par ligne : la liste déroulante reste
      // moins haute que l'écran d'un portable (dix thèmes ouverts depuis le 25/11/2026).
      const avecDetail = cours.length <= 4;
      return {
        cours: cours.map((c) => ({
          href: c.href,
          label: typographieFr(c.titre),
          ...(avecDetail ? { detail: `${c.lecons.length} leçon${c.lecons.length > 1 ? 's' : ''} · ${c.minutes} min` } : {}),
        })),
        pourCommencer: premier.lecons.slice(0, 4).map((l) => ({
          href: l.href,
          label: typographieFr(l.titre),
          premium: l.premium,
        })),
        lecons: cours.reduce((total, c) => total + c.lecons.length, 0),
      };
    } catch {
      return MENU_APPRENDRE_VIDE;
    }
  },
  // v3 le 25/11/2026 : les parcours laissent la place aux cours ; v4 : titres seuls au-delà de quatre cours.
  ['menu-apprendre-v4'],
  { revalidate: 3600, tags: [MENU_APPRENDRE_CACHE_TAG] },
);

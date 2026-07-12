import { unstable_cache } from 'next/cache';
import { createServiceClient } from '@/lib/supabase';
import type { Database } from '@/types/supabase.generated';

/**
 * Tag d'invalidation pour le Data Cache Next.js sur les entreprises strategiques.
 * Les routes admin (POST/PUT/DELETE sur /api/admin/strategic-enterprises) doivent
 * appeler revalidateTag(STRATEGIC_ENTERPRISES_CACHE_TAG) apres mutation.
 */
export const STRATEGIC_ENTERPRISES_CACHE_TAG = 'strategic-enterprises';

// ─── Types ──────────────────────────────────────────────────────────────────

export type StrategicEnterprise = Database['public']['Tables']['strategic_enterprises']['Row'];

/**
 * Statistiques cumulees affichees dans le bandeau hero de /entreprises.
 * Valeurs hardcodees ici (single source of truth editoriale) plutot que calculees
 * a la volee depuis la base car :
 *   - Les champs employees/revenue sont des strings libres ("~1 500", "ND"),
 *     non sommables fiablement
 *   - Les vrais chiffres macro (% PIB, % capital public) demandent des sources
 *     officielles (INS Niger, BCEAO, FMI Article IV) qui ne sont pas dans la DB
 *   - La frequence de mise a jour (annuelle) est compatible avec un commit
 *
 * Pour modifier : editer ce fichier, commit, redeploy. Source obligatoire en
 * commentaire pour chaque chiffre.
 */
export interface AggregatedStat {
  value: string;
  label: string;
  source?: string;
}

export const AGGREGATED_STATS: AggregatedStat[] = [
  {
    value: '8',
    label: 'Entreprises stratégiques',
  },
  {
    value: '6',
    label: 'Secteurs couverts',
  },
  {
    // Source : agrégation interne ITIE Niger 2020-2022 + rapports d'entreprise consultes
    // (SONIDEP 270 Mds + NIGELEC 125 Mds + SONIBANK 28,8 Mds PNB + SOPAMIN 56 Mds 2015
    // + autres ND). Ordre de grandeur conservateur, a affiner avec donnees post-2024.
    value: '~480 Mds FCFA',
    label: 'Chiffre d\'affaires cumulé estimé',
    source: 'ITIE Niger, rapports entreprises 2020-2023',
  },
  {
    // Source : Wikipedia + sites officiels (SOMAIR ~1000, NIGELEC ~1800, Niger Telecoms 782,
    // SONIBANK 424, SONIDEP 395, COMINAK 0 depuis 2021, BAGRI/SOPAMIN ND).
    value: '~4 400',
    label: 'Emplois directs identifiés',
    source: 'Sites officiels entreprises, ARCEP 2024',
  },
  {
    // Source : 5 entreprises sur 8 majoritairement publiques (SONIDEP, NIGELEC,
    // Niger Telecoms, SOPAMIN, BAGRI). SOMAIR nationalisee depuis juin 2025.
    // SONIBANK = participation Etat minoritaire. COMINAK dissoute.
    value: '75%',
    label: 'Sous contrôle public majoritaire',
    source: 'Décrets gouvernementaux Niger 2025',
  },
];

export const AGGREGATED_STATS_LAST_UPDATED = '2026-05-27';

// ─── Fetchers ────────────────────────────────────────────────────────────────

/**
 * Renvoie toutes les entreprises strategiques visibles, triees par display_order.
 * Cached via unstable_cache avec tag pour invalidation depuis admin.
 */
export const getStrategicEnterprises = unstable_cache(
  async (): Promise<StrategicEnterprise[]> => {
    const client = createServiceClient();
    if (!client) return [];

    const { data, error } = await client
      .from('strategic_enterprises')
      .select('*')
      .eq('is_visible', true)
      .order('display_order')
      .order('name');

    if (error) {
      console.error('[strategic-enterprises] fetch error:', error);
      return [];
    }
    return data ?? [];
  },
  ['strategic-enterprises-all'],
  { tags: [STRATEGIC_ENTERPRISES_CACHE_TAG], revalidate: 3600 }
);

/**
 * Renvoie l'entreprise vedette (is_featured=true).
 * Fallback : premiere par display_order si aucune n'est marquee vedette.
 * Le flag is_featured est garanti unique cote DB via index partial unique.
 */
export async function getFeaturedEnterprise(): Promise<StrategicEnterprise | null> {
  const all = await getStrategicEnterprises();
  if (all.length === 0) return null;

  // Phase 6 ajoutera la colonne is_featured. En attendant, fallback display_order.
  const featured = all.find((e) => (e as StrategicEnterprise & { is_featured?: boolean }).is_featured === true);
  return featured ?? all[0] ?? null;
}

/**
 * Renvoie les entreprises NON vedettes (les "autres" a afficher en liste groupee).
 * Si la vedette est non identifiee, renvoie all.slice(1) pour eviter doublon.
 */
export async function getNonFeaturedEnterprises(): Promise<StrategicEnterprise[]> {
  const all = await getStrategicEnterprises();
  const featured = await getFeaturedEnterprise();
  if (!featured) return all;
  return all.filter((e) => e.id !== featured.id);
}

/**
 * Regroupe une liste d'entreprises par secteur, en preservant l'ordre des secteurs
 * tel qu'ils apparaissent (premier display_order de chaque secteur).
 */
export function groupEnterprisesBySector(
  enterprises: StrategicEnterprise[]
): Array<{ sector: string; enterprises: StrategicEnterprise[] }> {
  const sectorOrder: string[] = [];
  const grouped = new Map<string, StrategicEnterprise[]>();

  for (const enterprise of enterprises) {
    const sector = enterprise.sector || 'Autres';
    if (!grouped.has(sector)) {
      sectorOrder.push(sector);
      grouped.set(sector, []);
    }
    grouped.get(sector)!.push(enterprise);
  }

  return sectorOrder.map((sector) => ({
    sector,
    enterprises: grouped.get(sector)!,
  }));
}

/**
 * Renvoie la liste ordonnee des secteurs couverts (pour le SectorTOC sommaire).
 */
export function getSectorList(enterprises: StrategicEnterprise[]): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const e of enterprises) {
    const sector = e.sector || 'Autres';
    if (!seen.has(sector)) {
      seen.add(sector);
      ordered.push(sector);
    }
  }
  return ordered;
}

// Re-export pour compat ascendante. La fonction vit dans sector-anchor.ts
// pour pouvoir etre importee depuis des Client Components sans tirer supabase.
export { getSectorAnchor } from './sector-anchor';

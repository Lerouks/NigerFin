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
 * Chiffres du bandeau de /entreprises. Depuis le 24/11/2026, ils sont calculés
 * à partir des entreprises visibles en base, au lieu d'être écrits ici : la
 * version écrite à la main annonçait encore 8 entreprises et 6 secteurs après
 * le retrait de COMINAK, et un « 75 % sous contrôle public » sans vraie source,
 * retiré (règle de Raouf : rien d'affiché qui ne se source pas).
 */
export interface AggregatedStat {
  value: string;
  label: string;
  source?: string;
}

export function statistiquesAtlas(entreprises: StrategicEnterprise[]): AggregatedStat[] {
  const secteurs = new Set(entreprises.map((e) => e.sector).filter(Boolean));
  return [
    { value: String(entreprises.length), label: 'Entreprises stratégiques' },
    { value: String(secteurs.size), label: 'Secteurs couverts' },
  ];
}

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
  ['strategic-enterprises-all-2026-11-24g'],
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

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

// ─── Fetchers ────────────────────────────────────────────────────────────────

/**
 * Renvoie toutes les entreprises strategiques visibles, triees par display_order.
 * Sert la page Niger (carte et mur de logos) depuis que l'Atlas /entreprises y a
 * été fondu (24/11/2026).
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

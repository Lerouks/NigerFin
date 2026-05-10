import { createServiceClient } from '@/lib/supabase';

export interface LegalSection {
  id: string;
  heading: string;
  text: string;
  display_order: number;
  updated_at: string;
}

/** Fetch legal sections from Supabase, server-side. Returns [] if unavailable. */
export async function fetchLegalSections(slug: string): Promise<LegalSection[]> {
  try {
    const service = createServiceClient();
    if (!service) return [];

    const { data, error } = await service
      .from('legal_sections')
      .select('id, heading, text, display_order, updated_at')
      .eq('page_slug', slug)
      .order('display_order', { ascending: true });

    if (error) return [];
    return (data || []) as LegalSection[];
  } catch {
    return [];
  }
}

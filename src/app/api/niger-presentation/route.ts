import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function GET() {
  const supabase = createServiceClient();
  if (!supabase) return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });

  const [presentationRes, factsRes, regionsRes, resourcesRes, indicatorsRes] = await Promise.all([
    supabase.from('niger_presentation').select('*').eq('id', 1).single(),
    supabase.from('niger_country_facts').select('*').eq('is_visible', true).order('display_order', { ascending: true }),
    supabase.from('niger_regions').select('*').eq('is_visible', true).order('name'),
    supabase.from('niger_resources').select('*').eq('is_visible', true).order('economic_importance'),
    supabase.from('niger_economic_indicators').select('*').eq('is_visible', true).order('display_order', { ascending: true }),
  ]);

  return NextResponse.json({
    presentation: presentationRes.data || {},
    facts: factsRes.data || [],
    regions: regionsRes.data || [],
    resources: resourcesRes.data || [],
    indicators: indicatorsRes.data || [],
  });
}

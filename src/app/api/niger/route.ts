import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const [
    regionsRes,
    resourcesRes,
    resourceHistoryRes,
    indicatorsRes,
    indicatorHistoryRes,
    factsRes,
    partnersRes,
  ] = await Promise.all([
    supabase.from('niger_regions').select('*').order('name'),
    supabase.from('niger_resources').select('*, niger_regions(name)').eq('active', true).order('type'),
    supabase.from('niger_resource_history').select('*, niger_resources(name, type)').order('year'),
    supabase.from('niger_economic_indicators').select('*').order('display_order'),
    supabase.from('niger_indicator_history').select('*, niger_economic_indicators(indicator_key, label)').order('date'),
    supabase.from('niger_country_facts').select('*').order('display_order'),
    supabase.from('niger_partners').select('*').order('display_order'),
  ]);

  return NextResponse.json({
    regions: regionsRes.data || [],
    resources: resourcesRes.data || [],
    resourceHistory: resourceHistoryRes.data || [],
    indicators: indicatorsRes.data || [],
    indicatorHistory: indicatorHistoryRes.data || [],
    facts: factsRes.data || [],
    partners: partnersRes.data || [],
  });
}

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { marketData as fallbackData } from '@/data/mock-data';

// No static cache — data must propagate instantly after admin updates
export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json(fallbackData);
  }

  const { data, error } = await supabase
    .from('market_data')
    .select('*')
    .order('type')
    .order('name');

  if (error || !data || data.length === 0) {
    return NextResponse.json(fallbackData);
  }

  const mapped = data.map((item) => ({
    id: item.id,
    name: item.name,
    value: Number(item.value),
    change: Number(item.change),
    changePercent: Number(item.change_percent),
    type: item.type as 'currency' | 'commodity' | 'index' | 'crypto',
    symbol: item.symbol,
    unit: item.unit || '',
    source: item.source || '',
    updatedAt: item.updated_at || null,
    description: item.description || '',
    educationLink: item.education_link || '',
  }));

  return NextResponse.json(mapped);
}

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { marketData as fallbackData } from '@/data/mock-data';

export const revalidate = 60;

export async function GET() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json(fallbackData);
  }

  const { data, error } = await supabase
    .from('market_data')
    .select('*')
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
    type: item.type as 'currency' | 'commodity' | 'index',
    symbol: item.symbol,
  }));

  return NextResponse.json(mapped);
}

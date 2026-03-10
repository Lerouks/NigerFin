import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// Public read-only endpoint for flash banner
export async function GET() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ enabled: false, items: [] });
  }

  const { data } = await supabase
    .from('flash_banner')
    .select('enabled, items, updated_at')
    .order('id')
    .limit(1)
    .single();

  if (!data) {
    return NextResponse.json({ enabled: false, items: [] });
  }

  return NextResponse.json(data);
}

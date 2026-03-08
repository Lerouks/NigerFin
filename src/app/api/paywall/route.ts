import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { serverError } from '@/lib/api-error';

// GET: public endpoint to fetch paywall config
export async function GET() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });
  }

  const { data, error } = await supabase
    .from('paywall_config')
    .select('*')
    .eq('id', 1)
    .single();

  if (error) {
    return serverError(error, 'paywall');
  }

  return NextResponse.json(data);
}

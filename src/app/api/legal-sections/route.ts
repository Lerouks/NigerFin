import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { serverError } from '@/lib/api-error';

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('page');
  if (!slug) return NextResponse.json({ error: 'page parameter required' }, { status: 400 });

  const supabase = createServiceClient();
  if (!supabase) return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });

  const { data, error } = await supabase
    .from('legal_sections')
    .select('*')
    .eq('page_slug', slug)
    .order('display_order', { ascending: true });

  if (error) return serverError(error, 'legal-sections');

  return NextResponse.json(data || []);
}

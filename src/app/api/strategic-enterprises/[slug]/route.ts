import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const service = createServiceClient();
  if (!service) {
    return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });
  }

  const { data, error } = await service
    .from('strategic_enterprises')
    .select('*')
    .eq('slug', slug)
    .eq('is_visible', true)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Entreprise introuvable' }, { status: 404 });
  }

  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
  });
}

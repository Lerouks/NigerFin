import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { serverError } from '@/lib/api-error';

// Public read-only endpoint, returns visible enterprises ordered by display_order
export async function GET() {
  const service = createServiceClient();
  if (!service) {
    return NextResponse.json([], { status: 503 });
  }

  const { data, error } = await service
    .from('strategic_enterprises')
    .select('id, name, sector, description, logo_url, image_url')
    .eq('is_visible', true)
    .order('display_order')
    .order('name');

  if (error) return serverError(error, 'strategic-enterprises');

  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
  });
}

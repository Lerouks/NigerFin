import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { createServiceClient } from '@/lib/supabase';

export async function GET() {
  const service = createServiceClient();
  if (!service) return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });

  const { data, error } = await service
    .from('categories')
    .select('*')
    .order('name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const { name, slug, description } = await request.json();
  if (!name || !slug) return NextResponse.json({ error: 'Name and slug required' }, { status: 400 });

  const { data, error } = await auth.serviceClient
    .from('categories')
    .insert({ name, slug: slug.toLowerCase(), description })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const { id, name, slug, description } = await request.json();
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  const { data, error } = await auth.serviceClient
    .from('categories')
    .update({ name, slug: slug?.toLowerCase(), description })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  const { error } = await auth.serviceClient.from('categories').delete().eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

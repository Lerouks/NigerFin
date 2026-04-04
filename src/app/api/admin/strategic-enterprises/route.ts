import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin-auth';
import { serverError } from '@/lib/api-error';

// GET: list all strategic enterprises (admin)
export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const { data, error } = await auth.serviceClient
    .from('strategic_enterprises')
    .select('*')
    .order('display_order')
    .order('name');

  if (error) return serverError(error, 'admin-strategic-enterprises');
  return NextResponse.json(data);
}

// POST: create
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const body = await request.json();
  const { name, sector, description, logo_url, image_url, display_order, is_visible } = body;

  if (!name || !sector) {
    return NextResponse.json({ error: 'Nom et secteur requis' }, { status: 400 });
  }

  const { data, error } = await auth.serviceClient
    .from('strategic_enterprises')
    .insert({
      name,
      sector,
      description: description || '',
      logo_url: logo_url || null,
      image_url: image_url || null,
      display_order: display_order ?? 0,
      is_visible: is_visible ?? true,
    })
    .select()
    .single();

  if (error) return serverError(error, 'admin-strategic-enterprises');
  revalidatePath('/entreprises');
  return NextResponse.json(data);
}

// PUT: update
export async function PUT(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: 'ID requis' }, { status: 400 });
  }

  updates.updated_at = new Date().toISOString();

  const { data, error } = await auth.serviceClient
    .from('strategic_enterprises')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return serverError(error, 'admin-strategic-enterprises');
  revalidatePath('/entreprises');
  return NextResponse.json(data);
}

// DELETE: remove
export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID requis' }, { status: 400 });
  }

  const { error } = await auth.serviceClient
    .from('strategic_enterprises')
    .delete()
    .eq('id', id);

  if (error) return serverError(error, 'admin-strategic-enterprises');
  revalidatePath('/entreprises');
  return NextResponse.json({ success: true });
}

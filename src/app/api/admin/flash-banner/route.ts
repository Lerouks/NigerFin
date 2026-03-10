import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { serverError } from '@/lib/api-error';

// GET: admin read of flash banner config
export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const { data } = await auth.serviceClient
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

// PUT: admin update flash banner
export async function PUT(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const { serviceClient } = auth;

  const body = await request.json();
  const { enabled, items } = body;

  // Get the first row ID
  const { data: existing } = await serviceClient
    .from('flash_banner')
    .select('id')
    .order('id')
    .limit(1)
    .single();

  if (!existing) {
    return NextResponse.json({ error: 'Configuration introuvable' }, { status: 404 });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (enabled !== undefined) updates.enabled = enabled;
  if (items !== undefined) updates.items = items;

  const { data, error } = await serviceClient
    .from('flash_banner')
    .update(updates)
    .eq('id', existing.id)
    .select()
    .single();

  if (error) {
    return serverError(error, 'admin-flash-banner');
  }

  return NextResponse.json(data);
}

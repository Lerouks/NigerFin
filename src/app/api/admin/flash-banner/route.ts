import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { createServerSupabaseClient } from '@/lib/supabase';

// GET: public read of flash banner config
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

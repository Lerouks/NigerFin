import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { serverError } from '@/lib/api-error';

// GET: list all market data (admin only)
export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const { data, error } = await auth.serviceClient
    .from('market_data')
    .select('*')
    .order('type')
    .order('name');

  if (error) {
    return serverError(error, 'admin-market-data');
  }

  return NextResponse.json(data);
}

// POST: create new market data entry
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const { serviceClient } = auth;

  const body = await request.json();
  const { name, symbol, type, value, unit, source, description, education_link } = body;

  if (!name || !symbol || !type) {
    return NextResponse.json({ error: 'Nom, symbole et type requis' }, { status: 400 });
  }

  if (!['currency', 'commodity', 'index'].includes(type)) {
    return NextResponse.json({ error: 'Type invalide' }, { status: 400 });
  }

  const { data, error } = await serviceClient
    .from('market_data')
    .insert({
      name,
      symbol,
      type,
      value: value ?? 0,
      change: 0,
      change_percent: 0,
      unit: unit || '',
      source: source || '',
      description: description || '',
      education_link: education_link || '',
    })
    .select()
    .single();

  if (error) {
    return serverError(error, 'admin-market-data');
  }

  return NextResponse.json(data);
}

// PUT: update existing market data entry
export async function PUT(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const { serviceClient } = auth;

  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: 'ID requis' }, { status: 400 });
  }

  if (updates.type && !['currency', 'commodity', 'index'].includes(updates.type)) {
    return NextResponse.json({ error: 'Type invalide' }, { status: 400 });
  }

  // Auto-calculate variation when value is provided
  if (updates.value !== undefined) {
    const { data: current } = await serviceClient
      .from('market_data')
      .select('value')
      .eq('id', id)
      .single();

    if (current) {
      const oldValue = Number(current.value);
      const newValue = Number(updates.value);
      updates.change = newValue - oldValue;
      updates.change_percent = oldValue !== 0
        ? ((newValue - oldValue) / oldValue) * 100
        : 0;
    }
  }

  const { data, error } = await serviceClient
    .from('market_data')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return serverError(error, 'admin-market-data');
  }

  return NextResponse.json(data);
}

// DELETE: remove market data entry
export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const { serviceClient } = auth;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID requis' }, { status: 400 });
  }

  const { error } = await serviceClient
    .from('market_data')
    .delete()
    .eq('id', id);

  if (error) {
    return serverError(error, 'admin-market-data');
  }

  return NextResponse.json({ success: true });
}

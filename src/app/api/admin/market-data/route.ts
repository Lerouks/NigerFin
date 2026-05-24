import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin-auth';
import { serverError } from '@/lib/api-error';
import { parseJsonBody, isValidUUID } from '@/lib/validation';

// Sec H-2 : allowlist explicite des champs autorises en POST/PUT.
// Avant : { id, ...updates } => mass-assignment possible sur n'importe
// quelle colonne. Ici on accepte uniquement les colonnes editables par l'UI.
const MARKET_TYPE = z.enum(['currency', 'commodity', 'index', 'crypto']);

const CreateBody = z.object({
  name: z.string().min(1).max(120),
  symbol: z.string().min(1).max(32),
  type: MARKET_TYPE,
  value: z.union([z.string(), z.number()]).optional(),
  unit: z.string().max(32).optional(),
  source: z.string().max(120).optional(),
  description: z.string().max(2000).optional(),
  education_link: z.string().max(500).optional(),
});

const UpdateBody = z.object({
  id: z.string().refine((v) => isValidUUID(v), { message: 'id invalide' }),
  name: z.string().min(1).max(120).optional(),
  symbol: z.string().min(1).max(32).optional(),
  type: MARKET_TYPE.optional(),
  value: z.union([z.string(), z.number()]).optional(),
  unit: z.string().max(32).optional(),
  source: z.string().max(120).optional(),
  description: z.string().max(2000).optional(),
  education_link: z.string().max(500).optional(),
});

function revalidateMarketPages() {
  revalidatePath('/');
  revalidatePath('/marches');
}

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

  const parsed = await parseJsonBody(request, CreateBody);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  }
  const { name, symbol, type, value, unit, source, description, education_link } = parsed.data;

  const { data, error } = await serviceClient
    .from('market_data')
    .insert({
      name,
      symbol,
      type,
      value: typeof value === 'string' ? parseFloat(value.replace(',', '.')) || 0 : Number(value) || 0,
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

  revalidateMarketPages();
  return NextResponse.json(data);
}

// PUT: update existing market data entry
export async function PUT(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const { serviceClient } = auth;

  const parsed = await parseJsonBody(request, UpdateBody);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  }

  const { id, ...rawUpdates } = parsed.data;

  // Build updates from allowlist only (defensive : Zod a deja filtre,
  // mais on construit explicitement le payload pour ecarter tout risque
  // de mass-assignment futur).
  const updates: Record<string, unknown> = {};
  if (rawUpdates.name !== undefined) updates.name = rawUpdates.name;
  if (rawUpdates.symbol !== undefined) updates.symbol = rawUpdates.symbol;
  if (rawUpdates.type !== undefined) updates.type = rawUpdates.type;
  if (rawUpdates.unit !== undefined) updates.unit = rawUpdates.unit;
  if (rawUpdates.source !== undefined) updates.source = rawUpdates.source;
  if (rawUpdates.description !== undefined) updates.description = rawUpdates.description;
  if (rawUpdates.education_link !== undefined) updates.education_link = rawUpdates.education_link;

  // Normalize value: accept comma as decimal separator
  if (rawUpdates.value !== undefined) {
    const v = typeof rawUpdates.value === 'string'
      ? parseFloat(rawUpdates.value.replace(',', '.'))
      : Number(rawUpdates.value);
    updates.value = v;

    // Auto-calculate daily variation based on previous_close
    if (!isNaN(v)) {
      const { data: current } = await serviceClient
        .from('market_data')
        .select('value, previous_close')
        .eq('id', id)
        .single();

      if (current) {
        const refPrice = Number(current.previous_close) || Number(current.value);
        updates.change = v - refPrice;
        updates.change_percent = refPrice !== 0
          ? ((v - refPrice) / refPrice) * 100
          : 0;
      }
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

  revalidateMarketPages();
  return NextResponse.json(data);
}

// DELETE: remove market data entry
export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const { serviceClient } = auth;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id || !isValidUUID(id)) {
    return NextResponse.json({ error: 'ID invalide (UUID requis)' }, { status: 400 });
  }

  const { error } = await serviceClient
    .from('market_data')
    .delete()
    .eq('id', id);

  if (error) {
    return serverError(error, 'admin-market-data');
  }

  revalidateMarketPages();
  return NextResponse.json({ success: true });
}

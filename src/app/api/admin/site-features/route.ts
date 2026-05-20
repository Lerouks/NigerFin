import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { requireAdmin } from '@/lib/admin-auth';
import { serverError } from '@/lib/api-error';

// GET, admin read of site features toggles
export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const { data } = await auth.serviceClient
    .from('site_features')
    .select('market_ticker_enabled, updated_at')
    .eq('id', 1)
    .maybeSingle();

  if (!data) {
    // Pas de row, valeurs par defaut (table peut-etre vide ou pas encore creee).
    return NextResponse.json({ market_ticker_enabled: true, updated_at: null });
  }

  return NextResponse.json(data);
}

// PUT, admin update site features
export async function PUT(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const { serviceClient } = auth;

  const body = await request.json();
  const { market_ticker_enabled } = body;

  const updates: Record<string, unknown> = {};
  if (typeof market_ticker_enabled === 'boolean') {
    updates.market_ticker_enabled = market_ticker_enabled;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Aucun champ valide à mettre à jour' }, { status: 400 });
  }

  const { data, error } = await serviceClient
    .from('site_features')
    .upsert({ id: 1, ...updates }, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    return serverError(error, 'admin-site-features');
  }

  // Invalide le cache du fetcher serveur + force re-render de la home.
  revalidateTag('site-features', 'max');
  revalidatePath('/');

  return NextResponse.json(data);
}

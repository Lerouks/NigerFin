import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { requireAdmin } from '@/lib/admin-auth';
import { serverError } from '@/lib/api-error';
import { listSubscribers } from '@/lib/newsletter/subscribers';

// GET, admin read of site features toggles
export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const { data } = await auth.serviceClient
    .from('site_features')
    .select('market_ticker_enabled, prelaunch_enabled, updated_at')
    .eq('id', 1)
    .maybeSingle();

  // Nombre d'inscrits à la liste de lancement (source='prelaunch', actifs).
  const { total: waitlistCount } = await listSubscribers({
    source: 'prelaunch',
    status: 'active',
    limit: 1,
  });

  if (!data) {
    // Pas de row, valeurs par defaut (table peut-etre vide ou pas encore creee).
    return NextResponse.json({
      market_ticker_enabled: true,
      prelaunch_enabled: false,
      updated_at: null,
      waitlist_count: waitlistCount,
    });
  }

  return NextResponse.json({ ...data, waitlist_count: waitlistCount });
}

// PUT, admin update site features
export async function PUT(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const { serviceClient } = auth;

  const body = await request.json();
  const { market_ticker_enabled, prelaunch_enabled } = body;

  const updates: Record<string, unknown> = {};
  if (typeof market_ticker_enabled === 'boolean') {
    updates.market_ticker_enabled = market_ticker_enabled;
  }
  if (typeof prelaunch_enabled === 'boolean') {
    updates.prelaunch_enabled = prelaunch_enabled;
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

  // Invalide le cache du fetcher serveur + force re-render de tout le site.
  // Mode 'layout' : le mode pré-lancement est appliqué dans le layout racine,
  // donc toutes les routes doivent être revalidées, pas seulement la home.
  revalidateTag('site-features', 'max');
  revalidatePath('/', 'layout');

  return NextResponse.json(data);
}

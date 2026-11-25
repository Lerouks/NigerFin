import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getCorpsPremium } from '@/lib/apprendre/donnees';
import { isValidUUID } from '@/lib/validation';

/**
 * Corps et questions d'une leçon Premium publiée, pour un abonné dont l'accès
 * court encore, ou pour l'administration. Même règle que le contenu des
 * articles Premium (/api/articles/[slug]/content). Jamais mis en cache.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pasDeCache = { 'Cache-Control': 'private, no-store' };
  if (!isValidUUID(id)) {
    return NextResponse.json({ error: 'Leçon introuvable' }, { status: 404, headers: pasDeCache });
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Service indisponible' }, { status: 503, headers: pasDeCache });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Connexion requise' }, { status: 401, headers: pasDeCache });
  }

  const { data: profil } = await supabase
    .from('user_profiles')
    .select('role, subscription_status, subscription_end')
    .eq('id', user.id)
    .maybeSingle();

  const admin = profil?.role === 'admin';
  const abonne =
    profil?.role === 'premium' &&
    profil.subscription_status === 'active' &&
    !!profil.subscription_end &&
    new Date(profil.subscription_end) > new Date();
  if (!admin && !abonne) {
    return NextResponse.json({ error: 'Réservé aux abonnés Premium' }, { status: 403, headers: pasDeCache });
  }

  const lecon = await getCorpsPremium(id);
  if (!lecon) {
    return NextResponse.json({ error: 'Leçon introuvable' }, { status: 404, headers: pasDeCache });
  }
  return NextResponse.json(lecon, { headers: pasDeCache });
}

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { serverError } from '@/lib/api-error';
import { agregerProfils, type ProfilLu } from '@/lib/audience/profil-lecteurs';

/** Supabase rend au plus 1 000 lignes par appel : les profils se lisent par pages. */
const TAILLE_PAGE = 1000;

/**
 * GET : civilité, tranche d'âge et profession déclarées par les lecteurs, en
 * nombres seulement. Aucun nom ni adresse ne sort de la base.
 */
export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const { serviceClient } = auth;

  const { count: equipe, error: erreurEquipe } = await serviceClient
    .from('user_profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'admin');
  if (erreurEquipe) return serverError(erreurEquipe, 'admin-audience-profil');

  const profils: ProfilLu[] = [];
  for (let debut = 0; ; debut += TAILLE_PAGE) {
    const { data, error } = await serviceClient
      .from('user_profiles')
      .select('civility, age_range, profession')
      .neq('role', 'admin')
      .order('id')
      .range(debut, debut + TAILLE_PAGE - 1);
    if (error) return serverError(error, 'admin-audience-profil');
    profils.push(...(data ?? []));
    if (!data || data.length < TAILLE_PAGE) break;
  }

  return NextResponse.json(agregerProfils(profils, equipe ?? 0), {
    headers: { 'Cache-Control': 'no-store' },
  });
}

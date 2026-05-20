import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function POST() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, civility, full_name, first_name, last_name')
    .eq('id', user.id)
    .single();

  if (!profile || (profile.role !== 'premium' && profile.role !== 'admin')) {
    return NextResponse.json({ error: 'Abonnement Premium requis' }, { status: 403 });
  }

  // Composer le nom affiche : prenom + nom si dispo, sinon full_name complet
  const composedName = [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim();
  const recipientName = composedName || profile.full_name || '';

  return NextResponse.json({
    ok: true,
    recipientCivility: profile.civility || null,
    recipientName,
  });
}

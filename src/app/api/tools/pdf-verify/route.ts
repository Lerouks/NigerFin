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

  // Convention française type private banking : "M. Nom" / "Mme Nom" sans le prenom.
  // Source preferee : last_name explicite dans le profil (l'utilisateur a indique
  // lui-meme quel est son nom de famille).
  // Fallback : pour les anciens comptes qui n'ont qu'un full_name, on prend
  // le DERNIER mot du full_name (convention francophone : "Prenom(s) Nom").
  let recipientName = (profile.last_name ?? '').trim();
  if (!recipientName && profile.full_name) {
    const parts = profile.full_name.trim().split(/\s+/).filter(Boolean);
    recipientName = parts.length > 0 ? parts[parts.length - 1] ?? '' : '';
  }

  return NextResponse.json({
    ok: true,
    recipientCivility: profile.civility || null,
    recipientName,
  });
}

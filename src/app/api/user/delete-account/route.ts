import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';
import { CompteAvecFactures, deleteUserCompletely } from '@/lib/delete-user';

export async function DELETE(request: NextRequest) {
  // Rate limit: 1 per hour per IP
  const ip = getClientIP(request);
  const rl = await checkRateLimit(`delete-account:${ip}`, 1, 60 * 60 * 1000);
  if (rl.limited) {
    return NextResponse.json({ error: 'Trop de tentatives. Réessayez dans 1 heure.' }, { status: 429 });
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const serviceClient = createServiceClient();
  if (!serviceClient) return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });

  // Get profile for name/email
  const { data: profile } = await serviceClient
    .from('user_profiles')
    .select('email, full_name, role')
    .eq('id', user.id)
    .single();

  // Un administrateur ne se supprime pas depuis « Mon compte » : il perdrait
  // l'accès au cockpit, et ses actions au journal bloqueraient la suppression.
  if (profile?.role === 'admin') {
    return NextResponse.json(
      { error: 'Un compte administrateur ne se supprime pas depuis cette page.' },
      { status: 403 },
    );
  }

  try {
    await deleteUserCompletely(
      serviceClient,
      user.id,
      profile?.email || user.email || '',
      profile?.full_name || '',
      user.id, // deleted by self
    );
  } catch (err) {
    if (err instanceof CompteAvecFactures) {
      return NextResponse.json({ error: err.message, factures: true }, { status: 409 });
    }
    return NextResponse.json({ error: 'La suppression n’a pas abouti. Écrivez-nous à contact@nfireport.com\u00A0: nous la terminerons pour vous.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

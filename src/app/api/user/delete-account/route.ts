import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';
import { deleteUserCompletely } from '@/lib/delete-user';

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
    .select('email, full_name')
    .eq('id', user.id)
    .single();

  try {
    await deleteUserCompletely(
      serviceClient,
      user.id,
      profile?.email || user.email || '',
      profile?.full_name || '',
      user.id, // deleted by self
    );
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message || 'Erreur lors de la suppression' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

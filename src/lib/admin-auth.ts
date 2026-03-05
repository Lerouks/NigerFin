import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

/**
 * Verify the current user is an admin. Returns { user, serviceClient } or a 403 response.
 */
export async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { error: NextResponse.json({ error: 'Service indisponible' }, { status: 503 }) };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Accès refusé' }, { status: 403 }) };
  }

  const serviceClient = createServiceClient();
  if (!serviceClient) {
    return { error: NextResponse.json({ error: 'Service indisponible' }, { status: 503 }) };
  }

  return { user, serviceClient };
}

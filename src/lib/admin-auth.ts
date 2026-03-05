import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

/**
 * Verify the current user is an admin. Returns { user, serviceClient } or a 403 response.
 * Logs denied attempts for diagnostics.
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

  // Use service client to read profile — bypasses RLS to avoid false negatives
  const serviceClient = createServiceClient();
  if (!serviceClient) {
    return { error: NextResponse.json({ error: 'Service indisponible' }, { status: 503 }) };
  }

  const { data: profile } = await serviceClient
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    // Log denied admin access attempt
    try {
      await serviceClient.from('auth_attempts').insert({
        event_type: 'admin_access_denied',
        email: user.email || 'unknown',
        ip_address: 'server',
        user_agent: `role=${profile?.role || 'no_profile'}`,
      });
    } catch {}
    return { error: NextResponse.json({ error: 'Accès refusé' }, { status: 403 }) };
  }

  return { user, serviceClient };
}

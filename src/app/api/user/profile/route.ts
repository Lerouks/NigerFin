import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Check if premium count needs reset
  try {
    await supabase.rpc('reset_monthly_premium_count');
  } catch {}

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    // Auto-create profile if missing — use service client to bypass RLS
    const serviceClient = createServiceClient();
    if (!serviceClient) {
      return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });
    }

    const { data: newProfile } = await serviceClient
      .from('user_profiles')
      .insert({
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || '',
        role: 'reader',
        subscription_status: 'inactive',
      })
      .select()
      .single();

    return NextResponse.json(newProfile);
  }

  return NextResponse.json(profile);
}

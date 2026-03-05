import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { syncContactToBrevo } from '@/lib/brevo';

export async function POST() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('email, full_name, role')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const success = await syncContactToBrevo({
    email: profile.email,
    firstName: profile.full_name,
    role: profile.role,
  });

  return NextResponse.json({ synced: success });
}

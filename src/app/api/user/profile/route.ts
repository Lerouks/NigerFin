import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase';
import { safeParseJSON } from '@/lib/validation';

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
    // Auto-create profile if missing, use service client to bypass RLS
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

export async function PUT(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await safeParseJSON(request);
  if (!body) {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 });
  }

  const { full_name, phone } = body as { full_name?: string; phone?: string };

  const updates: Record<string, string> = {};
  if (full_name !== undefined) updates.full_name = String(full_name).trim().slice(0, 200);
  if (phone !== undefined) updates.phone = String(phone).trim().slice(0, 30);

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Rien à modifier' }, { status: 400 });
  }

  const serviceClient = createServiceClient();
  if (!serviceClient) {
    return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });
  }

  const { data, error } = await serviceClient
    .from('user_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
  }

  return NextResponse.json(data);
}

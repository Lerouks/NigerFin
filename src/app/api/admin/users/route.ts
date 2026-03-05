import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase';

async function verifyAdmin() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return false;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return profile?.role === 'admin';
}

export async function GET() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const serviceClient = createServiceClient();
  if (!serviceClient) return NextResponse.json([]);

  const { data } = await serviceClient
    .from('user_profiles')
    .select('id, email, full_name, role, subscription_status, created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  return NextResponse.json(data || []);
}

export async function PUT(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { userId, role } = await request.json();
  if (!userId || !role) {
    return NextResponse.json({ error: 'userId and role required' }, { status: 400 });
  }

  const validRoles = ['reader', 'standard', 'pro', 'admin'];
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  const serviceClient = createServiceClient();
  if (!serviceClient) return NextResponse.json({ error: 'Not configured' }, { status: 503 });

  const { error } = await serviceClient
    .from('user_profiles')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

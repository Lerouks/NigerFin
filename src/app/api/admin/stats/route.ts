import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase';

export async function GET() {
  // Verify admin role
  const supabase = await createServerSupabaseClient();
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Use service client to count all users
  const serviceClient = createServiceClient();
  if (!serviceClient) return NextResponse.json({ error: 'Service client not configured' }, { status: 503 });

  const [totalRes, readersRes, standardRes, proRes] = await Promise.all([
    serviceClient.from('user_profiles').select('*', { count: 'exact', head: true }),
    serviceClient.from('user_profiles').select('*', { count: 'exact', head: true }).eq('role', 'reader'),
    serviceClient.from('user_profiles').select('*', { count: 'exact', head: true }).eq('role', 'standard'),
    serviceClient.from('user_profiles').select('*', { count: 'exact', head: true }).eq('role', 'pro'),
  ]);

  return NextResponse.json({
    total: totalRes.count || 0,
    readers: readersRes.count || 0,
    standard: standardRes.count || 0,
    pro: proRes.count || 0,
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  // Check if admin
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isAdmin = profile?.role === 'admin';

  // Filter by status if provided
  const statusFilter = request.nextUrl.searchParams.get('status');

  if (isAdmin) {
    // Admin: list all payment requests with user info
    const serviceClient = createServiceClient();
    if (!serviceClient) {
      return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });
    }

    let query = serviceClient
      .from('payment_requests')
      .select('*, user_profiles!payment_requests_user_profile_fkey(email, full_name)')
      .order('created_at', { ascending: false });

    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query.limit(100);

    if (error) {
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  }

  // Regular user: list own payment requests
  const { data, error } = await supabase
    .from('payment_requests')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

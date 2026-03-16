import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase';
import { parsePagination, paginatedResponse } from '@/lib/pagination';
import { isOneOf } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
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
    const params = parsePagination(request.nextUrl.searchParams);

    // Validate status filter
    const statusFilter = request.nextUrl.searchParams.get('status');
    const validStatuses = ['pending', 'verified', 'rejected'] as const;
    if (statusFilter && !isOneOf(statusFilter, validStatuses)) {
      return NextResponse.json({ error: 'Filtre statut invalide' }, { status: 400 });
    }

    if (isAdmin) {
      const serviceClient = createServiceClient();
      if (!serviceClient) {
        return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });
      }

      // Count
      let countQuery = serviceClient
        .from('payment_requests')
        .select('*', { count: 'exact', head: true });
      if (statusFilter) countQuery = countQuery.eq('status', statusFilter);
      const { count } = await countQuery;

      // Data
      let query = serviceClient
        .from('payment_requests')
        .select('*, user_profiles!payment_requests_user_profile_fkey(email, full_name)')
        .order('created_at', { ascending: false })
        .range(params.offset, params.offset + params.limit - 1);

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) {
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
      }

      return NextResponse.json(paginatedResponse(data || [], count || 0, params));
    }

    // Regular user: list own payment requests with pagination
    const { count } = await supabase
      .from('payment_requests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const { data, error } = await supabase
      .from('payment_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(params.offset, params.offset + params.limit - 1);

    if (error) {
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    return NextResponse.json(paginatedResponse(data || [], count || 0, params));
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

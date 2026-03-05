import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const { serviceClient } = auth;
  const url = request.nextUrl;
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = 50;
  const offset = (page - 1) * limit;

  const { data, error, count } = await serviceClient
    .from('audit_log')
    .select('*, user_profiles!audit_log_admin_profile_fkey(email, full_name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    // Fallback without join if FK not set up
    const { data: fallback, count: fc } = await serviceClient
      .from('audit_log')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    return NextResponse.json({ data: fallback || [], total: fc || 0 });
  }

  return NextResponse.json({ data: data || [], total: count || 0 });
}

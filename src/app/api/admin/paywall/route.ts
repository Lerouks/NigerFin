import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { serverError } from '@/lib/api-error';

// GET: fetch paywall config (admin)
export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const { serviceClient } = auth;

  const { data, error } = await serviceClient
    .from('paywall_config')
    .select('*')
    .eq('id', 1)
    .single();

  if (error) {
    return serverError(error, 'admin-paywall');
  }

  return NextResponse.json(data);
}

// PUT: update paywall config (admin)
export async function PUT(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const { serviceClient } = auth;

  const body = await request.json();
  // Remove id from updates, always update row 1
  const { id: _id, ...updates } = body;

  const { data, error } = await serviceClient
    .from('paywall_config')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', 1)
    .select()
    .single();

  if (error) {
    return serverError(error, 'admin-paywall');
  }

  return NextResponse.json(data);
}

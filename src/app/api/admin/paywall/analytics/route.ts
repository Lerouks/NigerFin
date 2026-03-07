import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';

// GET: fetch paywall analytics summary (admin)
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const { serviceClient } = auth;

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '30', 10);

  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await serviceClient
    .from('paywall_analytics')
    .select('event_type, created_at')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const summary = {
    views: 0,
    click_subscribe: 0,
    click_login: 0,
    dismiss: 0,
    total: data?.length || 0,
  };

  for (const row of data || []) {
    if (row.event_type in summary) {
      summary[row.event_type as keyof typeof summary]++;
    }
  }

  return NextResponse.json({
    period_days: days,
    ...summary,
    conversion_rate: summary.views > 0
      ? ((summary.click_subscribe + summary.click_login) / summary.views * 100).toFixed(1)
      : '0.0',
  });
}

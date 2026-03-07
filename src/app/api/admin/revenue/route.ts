import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const { serviceClient } = auth;

  // Get all verified payments
  const { data: payments } = await serviceClient
    .from('payment_requests')
    .select('amount, tier, billing_cycle, payment_method, created_at, verified_at, status')
    .eq('status', 'verified')
    .order('created_at', { ascending: true });

  if (!payments || payments.length === 0) {
    return NextResponse.json({
      totalRevenue: 0,
      thisMonth: 0,
      lastMonth: 0,
      growthPercent: 0,
      byTier: { premium: 0 },
      byMethod: { nita: 0, amana: 0 },
      monthly: [],
      totalPayments: 0,
      pendingCount: 0,
    });
  }

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  let totalRevenue = 0;
  let thisMonth = 0;
  let lastMonth = 0;
  const byTier: Record<string, number> = { premium: 0 };
  const byMethod: Record<string, number> = { nita: 0, amana: 0 };
  const monthlyMap: Record<string, number> = {};

  for (const p of payments) {
    const amount = p.amount || 0;
    totalRevenue += amount;

    const date = new Date(p.verified_at || p.created_at);
    if (date >= thisMonthStart) thisMonth += amount;
    if (date >= lastMonthStart && date <= lastMonthEnd) lastMonth += amount;

    if (p.tier in byTier) byTier[p.tier] += amount;
    if (p.payment_method in byMethod) byMethod[p.payment_method] += amount;

    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyMap[key] = (monthlyMap[key] || 0) + amount;
  }

  const growthPercent = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : thisMonth > 0 ? 100 : 0;

  // Get pending count
  const { count: pendingCount } = await serviceClient
    .from('payment_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  // Monthly time series (last 12 months)
  const monthly: { month: string; revenue: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthly.push({ month: key, revenue: monthlyMap[key] || 0 });
  }

  return NextResponse.json({
    totalRevenue,
    thisMonth,
    lastMonth,
    growthPercent,
    byTier,
    byMethod,
    monthly,
    totalPayments: payments.length,
    pendingCount: pendingCount || 0,
  });
}

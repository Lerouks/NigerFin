import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const { serviceClient } = auth;

  const [totalRes, readersRes, premiumRes, activeRes, blockedRes, pendingPayRes] = await Promise.all([
    serviceClient.from('user_profiles').select('*', { count: 'exact', head: true }),
    serviceClient.from('user_profiles').select('*', { count: 'exact', head: true }).eq('role', 'reader'),
    serviceClient.from('user_profiles').select('*', { count: 'exact', head: true }).eq('role', 'premium'),
    serviceClient.from('user_profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'active'),
    serviceClient.from('user_profiles').select('*', { count: 'exact', head: true }).eq('blocked', true),
    serviceClient.from('payment_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);

  return NextResponse.json({
    total: totalRes.count || 0,
    readers: readersRes.count || 0,
    premium: premiumRes.count || 0,
    activeSubscriptions: activeRes.count || 0,
    blockedUsers: blockedRes.count || 0,
    pendingPayments: pendingPayRes.count || 0,
  });
}

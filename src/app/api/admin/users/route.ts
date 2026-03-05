import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { logAuditEvent } from '@/lib/audit';
import { cycleMonths } from '@/config/pricing';
import type { BillingCycle } from '@/config/pricing';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const { serviceClient } = auth;
  const url = request.nextUrl;
  const search = url.searchParams.get('search') || '';
  const roleFilter = url.searchParams.get('role') || '';
  const statusFilter = url.searchParams.get('status') || '';

  let query = serviceClient
    .from('user_profiles')
    .select('id, email, full_name, role, subscription_status, billing_cycle, blocked, created_at')
    .order('created_at', { ascending: false })
    .limit(500);

  if (roleFilter) query = query.eq('role', roleFilter);
  if (statusFilter) query = query.eq('subscription_status', statusFilter);
  if (search) query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);

  const { data } = await query;
  return NextResponse.json(data || []);
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const { user, serviceClient } = auth;
  const body = await request.json();
  const { userId, action } = body;

  if (!userId || !action) {
    return NextResponse.json({ error: 'userId and action required' }, { status: 400 });
  }

  const now = new Date().toISOString();

  switch (action) {
    case 'changeRole': {
      const { role } = body;
      const validRoles = ['reader', 'standard', 'pro', 'admin'];
      if (!role || !validRoles.includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }
      await serviceClient
        .from('user_profiles')
        .update({ role, updated_at: now })
        .eq('id', userId);

      await logAuditEvent(user.id, 'change_role', 'user', userId, { newRole: role });
      return NextResponse.json({ success: true });
    }

    case 'block': {
      await serviceClient
        .from('user_profiles')
        .update({ blocked: true, updated_at: now })
        .eq('id', userId);

      await logAuditEvent(user.id, 'block_user', 'user', userId);
      return NextResponse.json({ success: true });
    }

    case 'unblock': {
      await serviceClient
        .from('user_profiles')
        .update({ blocked: false, updated_at: now })
        .eq('id', userId);

      await logAuditEvent(user.id, 'unblock_user', 'user', userId);
      return NextResponse.json({ success: true });
    }

    case 'activateSubscription': {
      const { tier, billingCycle } = body;
      if (!tier || !billingCycle) {
        return NextResponse.json({ error: 'tier and billingCycle required' }, { status: 400 });
      }

      const months = cycleMonths(billingCycle as BillingCycle);
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + months);

      // Preserve admin role — only change role for non-admin users
      const { data: targetProfile } = await serviceClient
        .from('user_profiles')
        .select('role')
        .eq('id', userId)
        .single();

      const newRole = targetProfile?.role === 'admin' ? 'admin' : (tier === 'pro' ? 'pro' : 'standard');

      await serviceClient
        .from('user_profiles')
        .update({ role: newRole, subscription_status: 'active', billing_cycle: billingCycle, updated_at: now })
        .eq('id', userId);

      await serviceClient
        .from('subscriptions')
        .upsert(
          {
            user_id: userId,
            tier,
            status: 'active',
            billing_cycle: billingCycle,
            current_period_start: now,
            current_period_end: expiresAt.toISOString(),
          },
          { onConflict: 'user_id' }
        );

      await logAuditEvent(user.id, 'activate_subscription', 'user', userId, { tier, billingCycle, expiresAt: expiresAt.toISOString() });
      return NextResponse.json({ success: true });
    }

    case 'deactivateSubscription': {
      // Preserve admin role on deactivation
      const { data: deactProfile } = await serviceClient
        .from('user_profiles')
        .select('role')
        .eq('id', userId)
        .single();

      const deactRole = deactProfile?.role === 'admin' ? 'admin' : 'reader';

      await serviceClient
        .from('user_profiles')
        .update({ role: deactRole, subscription_status: 'inactive', updated_at: now })
        .eq('id', userId);

      await serviceClient
        .from('subscriptions')
        .update({ status: 'cancelled', updated_at: now })
        .eq('user_id', userId);

      await logAuditEvent(user.id, 'deactivate_subscription', 'user', userId);
      return NextResponse.json({ success: true });
    }

    default:
      return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
  }
}

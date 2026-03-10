import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { logAuditEvent } from '@/lib/audit';
import { sendTransactionalEmail } from '@/lib/email';
import { adminPremiumGrantedEmail, adminDowngradeToFreeEmail } from '@/lib/email-templates';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const { serviceClient } = auth;
  const url = request.nextUrl;
  const search = url.searchParams.get('search') || '';
  const roleFilter = url.searchParams.get('role') || '';
  const statusFilter = url.searchParams.get('status') || '';
  const userId = url.searchParams.get('userId') || '';

  // Single user detail fetch
  if (userId) {
    const { data } = await serviceClient
      .from('user_profiles')
      .select('id, email, full_name, role, subscription_status, blocked, created_at, subscription_start, subscription_end, subscription_granted_by, subscription_updated_at')
      .eq('id', userId)
      .single();

    if (!data) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { data: sub } = await serviceClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    return NextResponse.json({ ...data, subscription: sub || null });
  }

  let query = serviceClient
    .from('user_profiles')
    .select('id, email, full_name, role, subscription_status, blocked, created_at, subscription_start, subscription_end')
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

  // Fetch target user for email and role checks
  const { data: targetUser } = await serviceClient
    .from('user_profiles')
    .select('email, full_name, role, subscription_status')
    .eq('id', userId)
    .single();

  if (!targetUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  switch (action) {
    case 'changeRole': {
      const { role } = body;
      const validRoles = ['reader', 'premium', 'admin'];
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
      const { durationMonths, customDays } = body;
      const months = parseInt(durationMonths) || 1;

      const startDate = new Date();
      const endDate = new Date();

      if (customDays && parseInt(customDays) > 0) {
        endDate.setDate(endDate.getDate() + parseInt(customDays));
      } else {
        endDate.setMonth(endDate.getMonth() + months);
      }

      const billingCycle = months === 1 ? 'monthly' : months === 3 ? 'quarterly' : 'yearly';
      const newRole = targetUser.role === 'admin' ? 'admin' : 'premium';

      await serviceClient
        .from('user_profiles')
        .update({
          role: newRole,
          subscription_status: 'active',
          subscription_start: startDate.toISOString(),
          subscription_end: endDate.toISOString(),
          subscription_granted_by: user.id,
          subscription_updated_at: now,
          expiration_warning_sent: false,
          updated_at: now,
        })
        .eq('id', userId);

      await serviceClient
        .from('subscriptions')
        .upsert(
          {
            user_id: userId,
            tier: 'premium',
            status: 'active',
            billing_cycle: billingCycle,
            current_period_start: startDate.toISOString(),
            current_period_end: endDate.toISOString(),
          },
          { onConflict: 'user_id' }
        );

      const durationLabel = customDays
        ? `${customDays} jours`
        : months === 1 ? '1 mois' : months === 3 ? '3 mois' : months === 6 ? '6 mois' : `${months} mois`;

      try {
        const emailData = adminPremiumGrantedEmail(
          targetUser.full_name || 'Client',
          startDate.toISOString(),
          endDate.toISOString(),
        );
        await sendTransactionalEmail({ to: targetUser.email, ...emailData });
      } catch {
        // Email failure should not block subscription activation
      }

      await logAuditEvent(user.id, 'activate_subscription', 'user', userId, {
        tier: 'premium',
        duration: durationLabel,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        userName: targetUser.full_name,
        userEmail: targetUser.email,
      });

      return NextResponse.json({
        success: true,
        subscription_start: startDate.toISOString(),
        subscription_end: endDate.toISOString(),
      });
    }

    case 'deactivateSubscription': {
      const deactRole = targetUser.role === 'admin' ? 'admin' : 'reader';

      await serviceClient
        .from('user_profiles')
        .update({
          role: deactRole,
          subscription_status: 'inactive',
          subscription_updated_at: now,
          updated_at: now,
        })
        .eq('id', userId);

      await serviceClient
        .from('subscriptions')
        .update({ status: 'cancelled', updated_at: now })
        .eq('user_id', userId);

      try {
        const emailData = adminDowngradeToFreeEmail(targetUser.full_name || 'Client');
        await sendTransactionalEmail({ to: targetUser.email, ...emailData });
      } catch {
        // Email failure should not block deactivation
      }

      await logAuditEvent(user.id, 'deactivate_subscription', 'user', userId, {
        userName: targetUser.full_name,
        userEmail: targetUser.email,
      });

      return NextResponse.json({ success: true });
    }

    default:
      return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
  }
}

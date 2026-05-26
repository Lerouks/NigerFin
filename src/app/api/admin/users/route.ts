import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { logAuditEvent } from '@/lib/audit';
import { sendTransactionalEmail } from '@/lib/email';
import { adminPremiumGrantedEmail, adminDowngradeToFreeEmail } from '@/lib/email-templates';
import { isValidUUID, sanitizeSearchQuery, isOneOf, safeParseJSON } from '@/lib/validation';
import { parsePagination, paginatedResponse } from '@/lib/pagination';
import { deleteUserCompletely } from '@/lib/delete-user';
import * as Sentry from '@sentry/nextjs';

function getSuperAdminEmail(): string {
  const value = process.env.SUPER_ADMIN_EMAIL;
  if (!value) {
    throw new Error('SUPER_ADMIN_EMAIL env var is required');
  }
  return value;
}

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
    if (!isValidUUID(userId)) {
      return NextResponse.json({ error: 'userId invalide (UUID requis)' }, { status: 400 });
    }

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
      .select('id, user_id, tier, status, billing_cycle, current_period_start, current_period_end, started_at, expires_at, price_amount, created_at, updated_at')
      .eq('user_id', userId)
      .single();

    return NextResponse.json({ ...data, subscription: sub || null });
  }

  const params = parsePagination(url.searchParams);

  // Validate role/status filters against allowed values
  const validRoles = ['reader', 'premium', 'admin'] as const;
  const validStatuses = ['active', 'inactive', 'cancelled', 'past_due'] as const;

  if (roleFilter && !isOneOf(roleFilter, validRoles)) {
    return NextResponse.json({ error: 'Filtre rôle invalide' }, { status: 400 });
  }
  if (statusFilter && !isOneOf(statusFilter, validStatuses)) {
    return NextResponse.json({ error: 'Filtre statut invalide' }, { status: 400 });
  }

  // Single query for both count and data
  let query = serviceClient
    .from('user_profiles')
    .select('id, email, full_name, role, subscription_status, blocked, created_at, subscription_start, subscription_end', { count: 'exact', head: false })
    .order('created_at', { ascending: false })
    .range(params.offset, params.offset + params.limit - 1);

  if (roleFilter) query = query.eq('role', roleFilter);
  if (statusFilter) query = query.eq('subscription_status', statusFilter);
  if (search) {
    const sanitized = sanitizeSearchQuery(search);
    query = query.or(`email.ilike.%${sanitized}%,full_name.ilike.%${sanitized}%`);
  }

  const { data, count } = await query;
  return NextResponse.json(paginatedResponse(data || [], count || 0, params));
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    const { user, serviceClient } = auth;

    const body = await safeParseJSON(request);
    if (!body) {
      return NextResponse.json({ error: 'Corps de requête JSON invalide' }, { status: 400 });
    }

    const { userId, action } = body as { userId?: string; action?: string };

    if (!userId || !isValidUUID(userId)) {
      return NextResponse.json({ error: 'userId invalide (UUID requis)' }, { status: 400 });
    }
    if (!action) {
      return NextResponse.json({ error: 'action required' }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Fetch target user for email and role checks
    const { data: targetUser } = await serviceClient
      .from('user_profiles')
      .select('email, full_name, role, subscription_status, subscription_start')
      .eq('id', userId)
      .single();

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Super admin: only the owner can manage other admins
    const isSelf = userId === user.id;
    const isSuperAdmin = user.email === getSuperAdminEmail();
    const targetIsAdmin = targetUser.role === 'admin';

    switch (action) {
      case 'changeRole': {
        const { role } = body as { role?: string };
        const validRoles = ['reader', 'premium', 'admin'] as const;
        if (!role || !isOneOf(role, validRoles)) {
          return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }
        // Nobody can remove their own admin role
        if (isSelf && role !== 'admin') {
          return NextResponse.json({ error: 'Impossible de retirer votre propre role admin' }, { status: 400 });
        }
        // Only super admin can change role of another admin
        if (targetIsAdmin && !isSuperAdmin) {
          return NextResponse.json({ error: 'Seul l\'administrateur principal peut modifier le role d\'un autre admin' }, { status: 400 });
        }
        // Only super admin can promote to admin
        if (role === 'admin' && !isSuperAdmin) {
          return NextResponse.json({ error: 'Seul l\'administrateur principal peut nommer un admin' }, { status: 400 });
        }
        // Nobody can demote the super admin
        if (targetUser.email === getSuperAdminEmail() && role !== 'admin') {
          return NextResponse.json({ error: 'Impossible de modifier le role de l\'administrateur principal' }, { status: 400 });
        }
        // Sync subscription_status + subscriptions table with role
        const roleUpdates: Record<string, unknown> = { role, updated_at: now };
        if (role === 'reader' && targetUser.subscription_status === 'active') {
          roleUpdates.subscription_status = 'inactive';
          // Also update subscriptions table
          await serviceClient.from('subscriptions').update({ status: 'cancelled', updated_at: now }).eq('user_id', userId);
        } else if (role === 'premium' && targetUser.subscription_status !== 'active') {
          const endDate = new Date();
          endDate.setMonth(endDate.getMonth() + 1);
          roleUpdates.subscription_status = 'active';
          roleUpdates.subscription_start = roleUpdates.subscription_start || now;
          roleUpdates.subscription_end = endDate.toISOString();
          roleUpdates.subscription_granted_by = user.id;
          // Also create/update subscriptions table row
          await serviceClient.from('subscriptions').upsert({
            user_id: userId,
            tier: 'premium',
            status: 'active',
            billing_cycle: 'monthly',
            current_period_start: now,
            current_period_end: endDate.toISOString(),
          }, { onConflict: 'user_id' });
        }

        const { error: updateErr } = await serviceClient
          .from('user_profiles')
          .update(roleUpdates)
          .eq('id', userId);

        if (updateErr) {
          return NextResponse.json({ error: 'Erreur lors de la mise à jour du rôle' }, { status: 500 });
        }

        await logAuditEvent(user.id, 'change_role', 'user', userId, { newRole: role });
        return NextResponse.json({ success: true });
      }

      case 'block': {
        if (isSelf) {
          return NextResponse.json({ error: 'Impossible de vous bloquer vous-même' }, { status: 400 });
        }
        // Only super admin can block another admin
        if (targetIsAdmin && !isSuperAdmin) {
          return NextResponse.json({ error: 'Seul l\'administrateur principal peut bloquer un admin' }, { status: 400 });
        }
        // Nobody can block the super admin
        if (targetUser.email === getSuperAdminEmail()) {
          return NextResponse.json({ error: 'Impossible de bloquer l\'administrateur principal' }, { status: 400 });
        }
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
        const { durationMonths, customDays } = body as { durationMonths?: string; customDays?: string };
        const months = parseInt(durationMonths || '1') || 1;

        const startDate = new Date();
        const endDate = new Date();

        if (customDays && parseInt(customDays) > 0) {
          endDate.setDate(endDate.getDate() + parseInt(customDays));
        } else {
          endDate.setMonth(endDate.getMonth() + months);
        }

        const billingCycle = months === 1 ? 'monthly' : months === 3 ? 'quarterly' : 'yearly';
        const newRole = targetUser.role === 'admin' ? 'admin' : 'premium';

        // Upsert subscription FIRST to avoid race condition
        const { error: subErr } = await serviceClient
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

        if (subErr) {
          return NextResponse.json({ error: 'Erreur lors de la création de l\'abonnement' }, { status: 500 });
        }

        // Then update profile
        const { error: profErr } = await serviceClient
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

        if (profErr) {
          return NextResponse.json({ error: 'Erreur lors de la mise à jour du profil' }, { status: 500 });
        }

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
        } catch (err) {
          Sentry.captureException(err, { tags: { context: 'admin-premium-granted-email' }, extra: { userId } });
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
        } catch (err) {
          Sentry.captureException(err, { tags: { context: 'admin-downgrade-email' }, extra: { userId } });
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
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE: admin deletes a user account
export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const { user, serviceClient } = auth;
  const userId = request.nextUrl.searchParams.get('userId');

  if (!userId || !isValidUUID(userId)) {
    return NextResponse.json({ error: 'userId invalide (UUID requis)' }, { status: 400 });
  }

  // Fetch target user
  const { data: targetUser } = await serviceClient
    .from('user_profiles')
    .select('email, full_name')
    .eq('id', userId)
    .single();

  if (!targetUser) {
    return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
  }

  // Cannot delete super admin
  if (targetUser.email === getSuperAdminEmail()) {
    return NextResponse.json({ error: 'Impossible de supprimer l\'administrateur principal' }, { status: 400 });
  }

  try {
    await deleteUserCompletely(
      serviceClient,
      userId,
      targetUser.email,
      targetUser.full_name || '',
      user.id,
    );
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message || 'Erreur lors de la suppression' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

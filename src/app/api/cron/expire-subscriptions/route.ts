import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { sendTransactionalEmail } from '@/lib/email';
import { subscriptionExpiredEmail } from '@/lib/email-templates';
import { logAuditEvent } from '@/lib/audit';
import * as Sentry from '@sentry/nextjs';

/**
 * Cron endpoint: expires subscriptions that have passed their end date.
 * Updates user_profiles status to 'expired', role to 'reader',
 * sends expiration email, and logs to audit.
 *
 * Call daily via Vercel Cron or external scheduler:
 * GET /api/cron/expire-subscriptions
 * Header: Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const service = createServiceClient();
  if (!service) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }

  const now = new Date().toISOString();

  // Find users with active subscription that have passed their end date
  const { data: expiredUsers } = await service
    .from('user_profiles')
    .select('id, email, full_name, subscription_end, role')
    .eq('subscription_status', 'active')
    .not('subscription_end', 'is', null)
    .lt('subscription_end', now);

  if (!expiredUsers || expiredUsers.length === 0) {
    return NextResponse.json({ expired: 0 });
  }

  // Batch update user_profiles: set all expired users to 'expired' status
  const expiredUserIds = expiredUsers.map((u) => u.id);
  const adminIds = expiredUsers.filter((u) => u.role === 'admin').map((u) => u.id);
  const nonAdminIds = expiredUserIds.filter((id) => !adminIds.includes(id));

  // Batch DB updates in parallel
  const updatePromises: Promise<unknown>[] = [];

  if (nonAdminIds.length > 0) {
    updatePromises.push(
      service
        .from('user_profiles')
        .update({
          subscription_status: 'expired',
          role: 'reader',
          subscription_updated_at: now,
          updated_at: now,
        })
        .in('id', nonAdminIds)
    );
  }

  if (adminIds.length > 0) {
    updatePromises.push(
      service
        .from('user_profiles')
        .update({
          subscription_status: 'expired',
          subscription_updated_at: now,
          updated_at: now,
        })
        .in('id', adminIds)
    );
  }

  // Batch update subscriptions table
  updatePromises.push(
    service
      .from('subscriptions')
      .update({ status: 'expired', updated_at: now })
      .in('user_id', expiredUserIds)
      .eq('status', 'active')
  );

  await Promise.all(updatePromises);

  // Send expiration emails in parallel
  const emailResults = await Promise.allSettled(
    expiredUsers.map(async (user) => {
      const emailData = subscriptionExpiredEmail(
        user.full_name || 'Client',
        user.subscription_end,
      );
      await sendTransactionalEmail({ to: user.email, ...emailData });
    })
  );

  // Log failed emails to Sentry
  emailResults.forEach((result, index) => {
    if (result.status === 'rejected') {
      Sentry.captureException(result.reason, {
        tags: { context: 'cron-expiration-email' },
        extra: { userId: expiredUsers[index].id },
      });
    }
  });

  // Batch audit log inserts
  const auditRows = expiredUsers.map((user) => ({
    admin_id: user.id,
    action: 'subscription_expired',
    entity_type: 'user',
    entity_id: user.id,
    details: {
      userName: user.full_name,
      userEmail: user.email,
      expiredAt: user.subscription_end,
      action: 'expiration automatique',
    },
  }));

  await service.from('audit_log').insert(auditRows);

  return NextResponse.json({ expired: expiredUsers.length, total: expiredUsers.length });
}

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { sendTransactionalEmail } from '@/lib/email';
import { subscriptionExpiredEmail } from '@/lib/email-templates';
import { logAuditEvent } from '@/lib/audit';

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

  let expired = 0;

  for (const user of expiredUsers) {
    // Update user profile to expired
    const newRole = user.role === 'admin' ? 'admin' : 'reader';

    await service
      .from('user_profiles')
      .update({
        subscription_status: 'expired',
        role: newRole,
        subscription_updated_at: now,
        updated_at: now,
      })
      .eq('id', user.id);

    // Update subscriptions table
    await service
      .from('subscriptions')
      .update({ status: 'expired', updated_at: now })
      .eq('user_id', user.id)
      .eq('status', 'active');

    // Send expiration email
    try {
      const emailData = subscriptionExpiredEmail(
        user.full_name || 'Client',
        user.subscription_end,
      );
      await sendTransactionalEmail({ to: user.email, ...emailData });
    } catch {
      // Continue with next user
    }

    // Audit log (system action)
    try {
      await logAuditEvent('00000000-0000-0000-0000-000000000000', 'subscription_expired', 'user', user.id, {
        userName: user.full_name,
        userEmail: user.email,
        expiredAt: user.subscription_end,
        action: 'expiration automatique',
      });
    } catch {
      // The audit log FK might fail for the system UUID; use a fallback
      await service.from('audit_log').insert({
        admin_id: user.id, // Use user's own ID as fallback
        action: 'subscription_expired',
        entity_type: 'user',
        entity_id: user.id,
        details: {
          userName: user.full_name,
          userEmail: user.email,
          expiredAt: user.subscription_end,
          action: 'expiration automatique',
        },
      });
    }

    expired++;
  }

  return NextResponse.json({ expired, total: expiredUsers.length });
}

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { sendTransactionalEmail } from '@/lib/email';
import { subscriptionExpirationWarningEmail } from '@/lib/email-templates';

/**
 * Cron endpoint: sends expiration warning emails to users whose subscription
 * expires within the next 3 days. Secure with CRON_SECRET header.
 *
 * Call daily via Vercel Cron or external scheduler:
 * GET /api/cron/expiration-warning
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

  // Find active subscriptions expiring within the next 3 days
  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const { data: expiring } = await service
    .from('subscriptions')
    .select('user_id, current_period_end')
    .eq('status', 'active')
    .gte('current_period_end', now.toISOString())
    .lte('current_period_end', threeDaysFromNow.toISOString());

  if (!expiring || expiring.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  let sent = 0;

  for (const sub of expiring) {
    const { data: profile } = await service
      .from('user_profiles')
      .select('email, full_name, expiration_warning_sent')
      .eq('id', sub.user_id)
      .single();

    if (!profile?.email || profile.expiration_warning_sent) continue;

    const warning = subscriptionExpirationWarningEmail(
      profile.full_name || 'Client',
      sub.current_period_end,
    );

    try {
      await sendTransactionalEmail({ to: profile.email, ...warning });
      // Mark as sent to avoid duplicates
      await service
        .from('user_profiles')
        .update({ expiration_warning_sent: true })
        .eq('id', sub.user_id);
      sent++;
    } catch {
      // Continue with next user
    }
  }

  return NextResponse.json({ sent, total: expiring.length });
}

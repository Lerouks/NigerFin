import { NextRequest, NextResponse } from 'next/server';
import { verifyBearerSecret } from '@/lib/secret-compare';
import { createServiceClient } from '@/lib/supabase';
import { sendTransactionalEmail } from '@/lib/email';
import { subscriptionExpirationWarningEmail } from '@/lib/email-templates';
import * as Sentry from '@sentry/nextjs';

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

  if (!verifyBearerSecret(authHeader, cronSecret)) {
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

  // Batch fetch all profiles to avoid N+1 queries
  const userIds = expiring.map((s) => s.user_id);
  const { data: profiles } = await service
    .from('user_profiles')
    .select('id, email, full_name, expiration_warning_sent')
    .in('id', userIds);

  const profileMap = new Map(
    (profiles || []).map((p) => [p.id, p])
  );

  // Qual H-2 : un seul UPDATE batch a la fin de la boucle au lieu d'un UPDATE
  // par envoi reussi (N+1 vers Supabase, lent sur 50-100 expirations).
  const successUserIds: string[] = [];

  for (const sub of expiring) {
    const profile = profileMap.get(sub.user_id);
    if (!profile?.email || profile.expiration_warning_sent) continue;

    const warning = subscriptionExpirationWarningEmail(
      profile.full_name || 'Client',
      sub.current_period_end,
    );

    try {
      await sendTransactionalEmail({ to: profile.email, ...warning });
      successUserIds.push(sub.user_id);
    } catch (err) {
      Sentry.captureException(err, { tags: { context: 'cron-expiration-warning-email' }, extra: { userId: sub.user_id } });
    }
  }

  if (successUserIds.length > 0) {
    const { error: updateErr } = await service
      .from('user_profiles')
      .update({ expiration_warning_sent: true })
      .in('id', successUserIds);
    if (updateErr) {
      Sentry.captureException(updateErr, {
        tags: { context: 'cron-expiration-warning-batch-update' },
        extra: { successCount: successUserIds.length },
      });
    }
  }

  return NextResponse.json({ sent: successUserIds.length, total: expiring.length });
}

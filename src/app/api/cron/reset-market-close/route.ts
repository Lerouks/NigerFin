import { NextRequest, NextResponse } from 'next/server';
import { verifyBearerSecret } from '@/lib/secret-compare';
import { createServiceClient } from '@/lib/supabase';
import * as Sentry from '@sentry/nextjs';

/**
 * Cron endpoint: resets previous_close to current value each day at midnight.
 * This ensures change/change_percent reflect daily variation, not cumulative.
 *
 * GET /api/cron/reset-market-close
 * Header: Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!verifyBearerSecret(authHeader, cronSecret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Service client unavailable' }, { status: 500 });
  }

  const { error } = await supabase.rpc('reset_market_previous_close');

  if (error) {
    Sentry.captureException(error, { tags: { context: 'cron-reset-market-close' } });
    return NextResponse.json({ error: 'Erreur lors de la réinitialisation' }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'Previous close reset for all market data' });
}

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { serverError } from '@/lib/api-error';
import {
  listSubscribers,
  getSubscriberStats,
  type SubscriberStatus,
} from '@/lib/newsletter/subscribers';

const VALID_STATUS: Array<SubscriberStatus | 'all'> = [
  'all',
  'active',
  'unsubscribed',
  'bounced',
  'complained',
];

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    const params = request.nextUrl.searchParams;
    const statusParam = params.get('status') ?? 'active';
    const status = (VALID_STATUS as string[]).includes(statusParam)
      ? (statusParam as SubscriberStatus | 'all')
      : 'active';

    const source = params.get('source') ?? 'all';
    const q = params.get('q') ?? undefined;
    const page = Math.max(1, parseInt(params.get('page') ?? '1', 10) || 1);
    const limit = Math.min(
      200,
      Math.max(1, parseInt(params.get('limit') ?? '50', 10) || 50),
    );
    const includeStats = params.get('stats') === '1';

    const [list, stats] = await Promise.all([
      listSubscribers({ status, source, q, page, limit }),
      includeStats ? getSubscriberStats() : Promise.resolve(null),
    ]);

    return NextResponse.json({
      rows: list.rows,
      total: list.total,
      page,
      limit,
      stats,
    });
  } catch (err) {
    return serverError(err, 'admin-newsletter-subscribers-list');
  }
}

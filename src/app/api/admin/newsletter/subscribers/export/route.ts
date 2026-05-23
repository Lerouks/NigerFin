import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { serverError } from '@/lib/api-error';
import { listSubscribers, type SubscriberStatus } from '@/lib/newsletter/subscribers';

const VALID_STATUS: Array<SubscriberStatus | 'all'> = [
  'all',
  'active',
  'unsubscribed',
  'bounced',
  'complained',
];

/** Échappe une valeur pour CSV RFC 4180 (gestion des guillemets/virgules/sauts de ligne). */
function csvEscape(value: string | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

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

    const PAGE_SIZE = 200;
    let page = 1;
    const lines: string[] = [
      ['email', 'status', 'source', 'opt_in_at', 'unsubscribed_at', 'locale', 'user_id'].join(','),
    ];

    // Pagination interne pour éviter de loader des centaines de milliers de lignes en RAM
    while (true) {
      const { rows, total } = await listSubscribers({
        status,
        source,
        page,
        limit: PAGE_SIZE,
      });
      for (const row of rows) {
        lines.push(
          [
            csvEscape(row.email),
            csvEscape(row.status),
            csvEscape(row.source),
            csvEscape(row.opt_in_at),
            csvEscape(row.unsubscribed_at),
            csvEscape(row.locale),
            csvEscape(row.user_id),
          ].join(','),
        );
      }
      if (page * PAGE_SIZE >= total) break;
      page += 1;
      if (page > 500) break; // garde-fou : max 100 000 lignes
    }

    const filename = `nfi-abonnes-newsletter-${new Date().toISOString().slice(0, 10)}.csv`;
    return new Response(lines.join('\n'), {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (err) {
    return serverError(err, 'admin-newsletter-subscribers-export');
  }
}

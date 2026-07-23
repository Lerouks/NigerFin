import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { serverError } from '@/lib/api-error';
import { listTransactionalDefs } from '@/lib/emails/registry';

// Synchro immediate : jamais de cache sur les lectures admin.
export const dynamic = 'force-dynamic';

interface TxStatRow {
  email_type: string;
  delivered: number | string | null;
  opened: number | string | null;
  clicked: number | string | null;
  bounced: number | string | null;
}
const toInt = (v: unknown): number => {
  const n = typeof v === 'string' ? parseInt(v, 10) : typeof v === 'number' ? v : 0;
  return Number.isFinite(n) ? n : 0;
};

/**
 * GET /api/admin/emails/transactional[?stats=1]
 * Liste les e-mails transactionnels (metadonnees + objet rendu). Avec ?stats=1,
 * ajoute les compteurs par type (envoyés/ouverts) depuis transactional_email_events.
 * Admin only.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;
    const { serviceClient } = auth;

    const emails = listTransactionalDefs();
    let stats: Record<string, { delivered: number; opened: number; clicked: number; bounced: number }> | undefined;

    if (req.nextUrl.searchParams.get('stats') === '1') {
      stats = {};
      const { data, error } = await serviceClient.rpc('transactional_email_stats');
      if (!error && Array.isArray(data)) {
        for (const row of data as TxStatRow[]) {
          if (row?.email_type) {
            stats[row.email_type] = {
              delivered: toInt(row.delivered),
              opened: toInt(row.opened),
              clicked: toInt(row.clicked),
              bounced: toInt(row.bounced),
            };
          }
        }
      }
    }

    return NextResponse.json(
      stats ? { emails, stats } : { emails },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (err) {
    return serverError(err, 'admin-emails-transactional-list');
  }
}

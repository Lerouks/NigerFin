import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { isValidUUID } from '@/lib/validation';
import { serverError } from '@/lib/api-error';
import { getIssue } from '@/lib/newsletter/issues';

export const dynamic = 'force-dynamic';

interface Params { id: string; }

interface StatsRow {
  delivered: number | string | null;
  opened_unique: number | string | null;
  clicked_unique: number | string | null;
  bounced: number | string | null;
  complained: number | string | null;
  unsubscribed: number | string | null;
}

const toInt = (v: unknown): number => {
  const n = typeof v === 'string' ? parseInt(v, 10) : typeof v === 'number' ? v : 0;
  return Number.isFinite(n) ? n : 0;
};

/**
 * GET /api/admin/newsletter/:id/stats
 * Statistiques d'un numero, agregees EN DIRECT depuis newsletter_events
 * (source de verite). Repli sur les compteurs denormalises si la RPC n'est pas
 * encore deployee. Admin only.
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<Params> }) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;
    const { serviceClient } = auth;

    const { id } = await ctx.params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Identifiant invalide' }, { status: 400 });
    }

    const issue = await getIssue(id);
    if (!issue) {
      return NextResponse.json({ error: 'Numéro introuvable' }, { status: 404 });
    }

    // Agregat en direct via RPC. Repli sur les compteurs denormalises en cas d'erreur.
    let delivered = issue.delivered_count;
    let opened = issue.opened_count;
    let clicked = issue.clicked_count;
    let bounced = issue.bounced_count;
    let complained = 0;
    let unsubscribed = issue.unsubscribed_count;

    const { data, error } = await serviceClient.rpc('newsletter_issue_stats', { p_issue_id: id });
    if (!error && data) {
      const row = (Array.isArray(data) ? data[0] : data) as StatsRow | undefined;
      if (row) {
        delivered = toInt(row.delivered) || issue.delivered_count;
        opened = toInt(row.opened_unique);
        clicked = toInt(row.clicked_unique);
        bounced = toInt(row.bounced);
        complained = toInt(row.complained);
        unsubscribed = toInt(row.unsubscribed);
      }
    }

    const recipients = issue.recipients_count;
    const openBase = delivered || recipients;
    const rate = (part: number, base: number): number =>
      base > 0 ? Math.round((part / base) * 1000) / 10 : 0;

    return NextResponse.json(
      {
        issueId: id,
        status: issue.status,
        sentAt: issue.sent_at,
        recipients,
        delivered,
        opened,
        clicked,
        bounced,
        complained,
        unsubscribed,
        openRate: rate(opened, openBase),
        clickRate: rate(clicked, openBase),
        bounceRate: rate(bounced, recipients),
        complaintRate: rate(complained, recipients),
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (err) {
    return serverError(err, 'admin-newsletter-stats');
  }
}

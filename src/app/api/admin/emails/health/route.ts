import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { requireAdmin } from '@/lib/admin-auth';
import { serverError } from '@/lib/api-error';

export const dynamic = 'force-dynamic';

type SubStatus = 'active' | 'unsubscribed' | 'bounced' | 'complained';
const STATUSES: SubStatus[] = ['active', 'unsubscribed', 'bounced', 'complained'];

interface ResendDomain {
  name?: string;
  status?: string;
  region?: string;
}

/** Interroge l'API Resend pour le statut de verification du domaine d'envoi. */
async function fetchDomainStatus(): Promise<ResendDomain | null> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch('https://api.resend.com/domains', {
      headers: { Authorization: `Bearer ${key}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: ResendDomain[] };
    const list = Array.isArray(json?.data) ? json.data : [];
    const domain =
      list.find((d) => (d.name ?? '').includes('nfireport')) ?? list[0] ?? null;
    return domain ? { name: domain.name, status: domain.status, region: domain.region } : null;
  } catch (err) {
    Sentry.captureException(err, { tags: { context: 'admin-emails-health-resend' } });
    return null;
  }
}

/**
 * GET /api/admin/emails/health
 * Sante de delivrabilite : statut du domaine Resend + taux de rebond / plainte
 * calcules depuis newsletter_subscribers. Admin only.
 */
export async function GET() {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;
    const { serviceClient } = auth;

    const [domain, ...countResults] = await Promise.all([
      fetchDomainStatus(),
      ...STATUSES.map((status) =>
        serviceClient
          .from('newsletter_subscribers')
          .select('*', { count: 'exact', head: true })
          .eq('status', status)
          .then(({ count }) => count ?? 0),
      ),
    ]);

    const counts: Record<SubStatus, number> = {
      active: countResults[0] ?? 0,
      unsubscribed: countResults[1] ?? 0,
      bounced: countResults[2] ?? 0,
      complained: countResults[3] ?? 0,
    };
    const total = counts.active + counts.unsubscribed + counts.bounced + counts.complained;
    const bounceRate = total > 0 ? Math.round((counts.bounced / total) * 1000) / 10 : 0;
    const complaintRate = total > 0 ? Math.round((counts.complained / total) * 1000) / 10 : 0;

    // Verdict : vert / orange / rouge. Seuils sender-score : rebond > 2 %, plainte > 0,1 %.
    const domainVerified = domain?.status === 'verified';
    let verdict: 'green' | 'orange' | 'red' = 'green';
    const alerts: string[] = [];
    if (!domain) {
      verdict = 'orange';
      alerts.push("Statut du domaine Resend indisponible (clé API absente ou erreur réseau).");
    } else if (!domainVerified) {
      verdict = 'red';
      alerts.push(`Domaine d'envoi non vérifié (statut Resend : ${domain.status ?? 'inconnu'}).`);
    }
    if (bounceRate > 2) {
      verdict = 'red';
      alerts.push(`Taux de rebond élevé : ${bounceRate} % (seuil 2 %).`);
    } else if (bounceRate > 1 && verdict === 'green') {
      verdict = 'orange';
      alerts.push(`Taux de rebond à surveiller : ${bounceRate} %.`);
    }
    if (complaintRate > 0.1) {
      verdict = 'red';
      alerts.push(`Taux de plainte élevé : ${complaintRate} % (seuil 0,1 %).`);
    }

    return NextResponse.json(
      {
        verdict,
        alerts,
        domain,
        subscribers: {
          total,
          active: counts.active,
          unsubscribed: counts.unsubscribed,
          bounced: counts.bounced,
          complained: counts.complained,
          cooldown: counts.bounced + counts.complained,
        },
        bounceRate,
        complaintRate,
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (err) {
    return serverError(err, 'admin-emails-health');
  }
}

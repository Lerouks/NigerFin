import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

interface CheckResult {
  status: 'ok' | 'warn' | 'error';
  message: string;
}

interface SiteCheck {
  online: boolean;
  status: 'ok' | 'warn' | 'error';
  latencyMs: number | null;
  lastChecked: string;
  message: string;
}

interface SupabaseCheck {
  online: boolean;
  status: 'ok' | 'warn' | 'error';
  latencyMs: number | null;
  message: string;
}

interface CronCheck extends CheckResult {
  lastEventAt: string | null;
  successCount: number;
  failureCount: number;
}

interface IpayMoneyCheck extends CheckResult {
  avgDelayMs: number | null;
  verifiedCount: number;
  pendingOldCount: number;
}

interface SiteHealthResponse {
  site: SiteCheck;
  supabase: SupabaseCheck;
  cron: CronCheck;
  ipaymoney: IpayMoneyCheck;
  checkedAt: string;
}

const PUBLIC_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
  'https://www.nfireport.com';
const FETCH_TIMEOUT_MS = 5000;

export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const { serviceClient } = auth;
  const checkedAt = new Date().toISOString();

  const [site, supabase, cron, ipaymoney] = await Promise.all([
    checkSite(),
    checkSupabase(serviceClient),
    checkCron(serviceClient),
    checkIpayMoney(serviceClient),
  ]);

  const response: SiteHealthResponse = {
    site,
    supabase,
    cron,
    ipaymoney,
    checkedAt,
  };

  return NextResponse.json(response);
}

async function checkSite(): Promise<SiteCheck> {
  const lastChecked = new Date().toISOString();
  const started = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    // Tente d'abord /api/health, fallback racine si pas dispo
    let res = await fetch(`${PUBLIC_SITE_URL}/api/health`, {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store',
    }).catch(() => null);

    if (!res || !res.ok) {
      res = await fetch(`${PUBLIC_SITE_URL}/`, {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-store',
      }).catch(() => null);
    }

    clearTimeout(timeoutId);
    const latencyMs = Date.now() - started;

    if (!res) {
      return {
        online: false,
        status: 'error',
        latencyMs: null,
        lastChecked,
        message: 'Le site ne répond pas',
      };
    }

    if (!res.ok) {
      return {
        online: false,
        status: 'error',
        latencyMs,
        lastChecked,
        message: `Réponse HTTP ${res.status}`,
      };
    }

    // Latence acceptable < 2s, sinon warn
    const status: 'ok' | 'warn' = latencyMs > 2000 ? 'warn' : 'ok';
    return {
      online: true,
      status,
      latencyMs,
      lastChecked,
      message:
        status === 'warn'
          ? `Réponse lente (${latencyMs} ms)`
          : `En ligne (${latencyMs} ms)`,
    };
  } catch (err) {
    const message =
      err instanceof Error && err.name === 'AbortError'
        ? `Délai dépassé (>${FETCH_TIMEOUT_MS} ms)`
        : 'Échec de la vérification du site';
    return {
      online: false,
      status: 'error',
      latencyMs: null,
      lastChecked,
      message,
    };
  }
}

async function checkSupabase(
  serviceClient: ReturnType<typeof import('@/lib/supabase').createServiceClient>,
): Promise<SupabaseCheck> {
  if (!serviceClient) {
    return {
      online: false,
      status: 'error',
      latencyMs: null,
      message: 'Service Supabase indisponible',
    };
  }

  const started = Date.now();
  try {
    const { error } = await serviceClient
      .from('user_profiles')
      .select('id', { count: 'exact', head: true })
      .limit(1);

    const latencyMs = Date.now() - started;

    if (error) {
      return {
        online: false,
        status: 'error',
        latencyMs,
        message: 'Erreur de requête Supabase',
      };
    }

    const status: 'ok' | 'warn' = latencyMs > 1000 ? 'warn' : 'ok';
    return {
      online: true,
      status,
      latencyMs,
      message:
        status === 'warn'
          ? `Latence élevée (${latencyMs} ms)`
          : `Connecté (${latencyMs} ms)`,
    };
  } catch {
    return {
      online: false,
      status: 'error',
      latencyMs: null,
      message: 'Connexion Supabase impossible',
    };
  }
}

async function checkCron(
  serviceClient: ReturnType<typeof import('@/lib/supabase').createServiceClient>,
): Promise<CronCheck> {
  if (!serviceClient) {
    return {
      status: 'error',
      message: 'Service Supabase indisponible',
      lastEventAt: null,
      successCount: 0,
      failureCount: 0,
    };
  }

  try {
    // Inspecte les évènements récents du cron via audit_log (entity_type = 'cron')
    // ou les journaux api_health_log (alimentés par dataOrchestrator).
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: cronLogs } = await serviceClient
      .from('audit_log')
      .select('action, created_at, details')
      .eq('entity_type', 'cron')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(50);

    if (cronLogs && cronLogs.length > 0) {
      let successCount = 0;
      let failureCount = 0;
      for (const row of cronLogs) {
        const details = (row.details ?? {}) as Record<string, unknown>;
        const status = (details.status ?? row.action ?? '').toString();
        if (status.includes('success') || status.includes('ok')) successCount += 1;
        else if (status.includes('error') || status.includes('fail')) failureCount += 1;
      }
      const status: 'ok' | 'warn' | 'error' =
        failureCount === 0 ? 'ok' : successCount > failureCount ? 'warn' : 'error';
      return {
        status,
        message:
          status === 'ok'
            ? `${successCount} exécutions réussies (24 h)`
            : status === 'warn'
              ? `${failureCount} échec(s) sur ${successCount + failureCount}`
              : `${failureCount} échec(s) sur les dernières 24 h`,
        lastEventAt: cronLogs[0]?.created_at ?? null,
        successCount,
        failureCount,
      };
    }

    // Fallback: consulte api_health_log si disponible
    const { data: healthLogs } = await serviceClient
      .from('api_health_log')
      .select('status, checked_at')
      .gte('checked_at', since)
      .order('checked_at', { ascending: false })
      .limit(100);

    if (healthLogs && healthLogs.length > 0) {
      let successCount = 0;
      let failureCount = 0;
      for (const row of healthLogs) {
        if (row.status === 'success' || row.status === 'ok') successCount += 1;
        else failureCount += 1;
      }
      const total = successCount + failureCount;
      const successRate = total > 0 ? successCount / total : 1;
      const status: 'ok' | 'warn' | 'error' =
        successRate >= 0.95 ? 'ok' : successRate >= 0.7 ? 'warn' : 'error';
      return {
        status,
        message:
          status === 'ok'
            ? `Cron sains (${Math.round(successRate * 100)}% succès)`
            : `Taux de succès ${Math.round(successRate * 100)}%`,
        lastEventAt: healthLogs[0]?.checked_at ?? null,
        successCount,
        failureCount,
      };
    }

    // Aucune trace, on reste neutre
    return {
      status: 'warn',
      message: 'Aucun évènement cron enregistré sur 24 h',
      lastEventAt: null,
      successCount: 0,
      failureCount: 0,
    };
  } catch {
    return {
      status: 'warn',
      message: 'Vérification cron indisponible',
      lastEventAt: null,
      successCount: 0,
      failureCount: 0,
    };
  }
}

async function checkIpayMoney(
  serviceClient: ReturnType<typeof import('@/lib/supabase').createServiceClient>,
): Promise<IpayMoneyCheck> {
  if (!serviceClient) {
    return {
      status: 'error',
      message: 'Service Supabase indisponible',
      avgDelayMs: null,
      verifiedCount: 0,
      pendingOldCount: 0,
    };
  }

  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Paiements verified récents pour calcul du délai webhook
    const { data: verified } = await serviceClient
      .from('payment_requests')
      .select('created_at, verified_at, payment_method')
      .eq('status', 'verified')
      .gte('verified_at', since)
      .not('verified_at', 'is', null)
      .order('verified_at', { ascending: false })
      .limit(50);

    // Paiements en attente depuis plus de 30 min (signe d un webhook coince)
    const pendingThreshold = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { count: pendingOldCount } = await serviceClient
      .from('payment_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .lt('created_at', pendingThreshold);

    const verifiedRows = verified ?? [];
    const verifiedCount = verifiedRows.length;
    const stalledCount = pendingOldCount ?? 0;

    if (verifiedCount === 0 && stalledCount === 0) {
      return {
        status: 'ok',
        message: 'Aucun paiement à analyser sur 7 jours',
        avgDelayMs: null,
        verifiedCount: 0,
        pendingOldCount: 0,
      };
    }

    let totalDelayMs = 0;
    let delayCount = 0;
    for (const row of verifiedRows) {
      if (!row.verified_at || !row.created_at) continue;
      const delay =
        new Date(row.verified_at).getTime() - new Date(row.created_at).getTime();
      if (delay >= 0) {
        totalDelayMs += delay;
        delayCount += 1;
      }
    }

    const avgDelayMs = delayCount > 0 ? Math.round(totalDelayMs / delayCount) : null;

    let status: 'ok' | 'warn' | 'error' = 'ok';
    let message = `${verifiedCount} paiement(s) vérifié(s) sur 7 jours`;

    if (stalledCount > 0) {
      status = stalledCount > 3 ? 'error' : 'warn';
      message = `${stalledCount} paiement(s) bloqué(s) en attente depuis plus de 30 min`;
    } else if (avgDelayMs !== null && avgDelayMs > 5 * 60 * 1000) {
      status = 'warn';
      message = `Délai webhook moyen ${Math.round(avgDelayMs / 60000)} min`;
    } else if (avgDelayMs !== null) {
      message = `Délai webhook moyen ${Math.round(avgDelayMs / 1000)} s`;
    }

    return {
      status,
      message,
      avgDelayMs,
      verifiedCount,
      pendingOldCount: stalledCount,
    };
  } catch {
    return {
      status: 'warn',
      message: 'Vérification iPayMoney indisponible',
      avgDelayMs: null,
      verifiedCount: 0,
      pendingOldCount: 0,
    };
  }
}

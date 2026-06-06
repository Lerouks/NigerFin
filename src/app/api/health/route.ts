import { NextRequest, NextResponse } from 'next/server';
import { verifyBearerSecret } from '@/lib/secret-compare';
import { dataOrchestrator } from '@/lib/services';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase';
import * as Sentry from '@sentry/nextjs';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Verify cron secret for automated calls
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Allow access from admin or cron
  const isCron = verifyBearerSecret(authHeader, cronSecret);

  // Sec M-9 : sans auth (ni cron ni admin), on retourne uniquement un
  // statut binaire. Avant, l'endpoint exposait noms de services, success rates,
  // cache volumes, lastSuccessful timestamps => reconnaissance facilitee.
  let isAdmin = false;
  if (!isCron) {
    try {
      const supabase = await createServerSupabaseClient();
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const service = createServiceClient();
          if (service) {
            const { data: profile } = await service
              .from('user_profiles')
              .select('role')
              .eq('id', user.id)
              .single();
            isAdmin = profile?.role === 'admin';
          }
        }
      }
    } catch {
      // No auth context (anonymous) - rester sur reponse slim.
    }
  }

  try {
    const healthResults = await dataOrchestrator.healthCheck();

    // Calculate summary stats
    const services = Object.entries(healthResults);
    const healthy = services.filter(([, s]) => s.status === 'ok').length;
    const total = services.length;

    // Reponse slim pour visiteurs non authentifies (probes externes / curieux).
    // Retourne juste un statut global, pas la liste des services internes.
    if (!isCron && !isAdmin) {
      const status = healthy === total ? 'healthy' : healthy > 0 ? 'degraded' : 'down';
      return NextResponse.json({ status, timestamp: new Date().toISOString() });
    }

    // Get 24h success rate from Supabase
    const successRate24h: Record<string, number> = {};
    const lastSuccessful: Record<string, string> = {};
    const cacheVolume: Record<string, number> = {};

    const supabase = createServiceClient();
    if (supabase) {
      const twentyFourHoursAgo = new Date(Date.now() - 86400000).toISOString();

      // Success rate per source
      const { data: healthLogs } = await supabase
        .from('api_health_log')
        .select('source, status')
        .gte('checked_at', twentyFourHoursAgo);

      if (healthLogs) {
        const counts: Record<string, { total: number; success: number }> = {};
        for (const log of healthLogs) {
          const bucket = counts[log.source] ?? (counts[log.source] = { total: 0, success: 0 });
          bucket.total++;
          if (log.status === 'success') bucket.success++;
        }
        for (const [source, c] of Object.entries(counts)) {
          successRate24h[source] = c.total > 0 ? Math.round((c.success / c.total) * 100) : 0;
        }
      }

      // Last successful fetch per source
      const { data: lastSuccess } = await supabase
        .from('api_health_log')
        .select('source, checked_at')
        .eq('status', 'success')
        .order('checked_at', { ascending: false })
        .limit(50);

      if (lastSuccess) {
        const seen = new Set<string>();
        for (const row of lastSuccess) {
          if (!seen.has(row.source)) {
            lastSuccessful[row.source] = row.checked_at;
            seen.add(row.source);
          }
        }
      }

      // Cache volume per source
      const { data: cacheData } = await supabase
        .from('api_cache')
        .select('source');

      if (cacheData) {
        for (const row of cacheData) {
          cacheVolume[row.source] = (cacheVolume[row.source] || 0) + 1;
        }
      }
    }

    const response = {
      status: healthy === total ? 'healthy' : healthy > 0 ? 'degraded' : 'down',
      summary: { healthy, total, timestamp: new Date().toISOString() },
      services: Object.fromEntries(
        services.map(([name, result]) => [
          name,
          {
            ...result,
            successRate24h: successRate24h[name] ?? null,
            lastSuccessful: lastSuccessful[name] ?? null,
            cacheEntries: cacheVolume[name] ?? 0,
          },
        ])
      ),
      isCron,
    };

    // Log to Sentry if degraded
    if (healthy < total) {
      const failedServices = services
        .filter(([, s]) => s.status === 'error')
        .map(([name]) => name);
      Sentry.captureMessage(`API health degraded: ${failedServices.join(', ')}`, 'warning');
    }

    return NextResponse.json(response);
  } catch (err) {
    Sentry.captureException(err, { tags: { route: '/api/health' } });
    return NextResponse.json(
      { status: 'error', error: 'Health check failed' },
      { status: 500 }
    );
  }
}

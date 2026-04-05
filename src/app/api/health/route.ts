import { NextRequest, NextResponse } from 'next/server';
import { dataOrchestrator } from '@/lib/services';
import { createServiceClient } from '@/lib/supabase';
import * as Sentry from '@sentry/nextjs';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Verify cron secret for automated calls
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Allow access from admin or cron
  const isCron = cronSecret && authHeader === `Bearer ${cronSecret}`;

  try {
    const healthResults = await dataOrchestrator.healthCheck();

    // Calculate summary stats
    const services = Object.entries(healthResults);
    const healthy = services.filter(([, s]) => s.status === 'ok').length;
    const total = services.length;

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

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin-auth';
import { dataOrchestrator } from '@/lib/services/data-orchestrator';
import { construireMisesAJourMarche } from '@/lib/services/market-updates';
import * as Sentry from '@sentry/nextjs';

interface UpdateResult {
  symbol: string;
  status: 'updated' | 'skipped' | 'error';
  value?: number;
  error?: string;
}

/**
 * Admin endpoint: manually trigger market data sync.
 * Same logic as the cron, but authenticated via admin session.
 *
 * POST /api/admin/sync-market-data
 */
export async function POST() {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const { serviceClient } = auth;

  const results: UpdateResult[] = [];

  const [forexResult, commoditiesResult, indicesResult, cryptoResult, brvmResult] =
    await Promise.allSettled([
      dataOrchestrator.getForexData(),
      dataOrchestrator.getCommoditiesData(),
      dataOrchestrator.getIndicesData(),
      dataOrchestrator.getCryptoData(),
      dataOrchestrator.getBRVMIndices(),
    ]);

  // Meme construction que le cron, via le module partage : la regle d'integrite
  // des donnees ne doit pas dependre de deux copies a synchroniser a la main.
  const { updates, echecs } = construireMisesAJourMarche(
    {
      forex: forexResult,
      commodities: commoditiesResult,
      indices: indicesResult,
      crypto: cryptoResult,
      brvm: brvmResult,
    },
    'admin',
  );
  for (const echec of echecs) {
    results.push({ symbol: echec.symbol, status: 'error', error: echec.error });
  }

  for (const [symbol, { value: newValue, source }] of Object.entries(updates)) {
    try {
      const { data: current } = await serviceClient
        .from('market_data')
        .select('id, value, previous_close')
        .eq('symbol', symbol)
        .single();

      if (!current) {
        results.push({ symbol, status: 'skipped', error: 'Symbole non trouvé' });
        continue;
      }

      const refPrice = Number(current.previous_close) || Number(current.value);
      const change = Math.round((newValue - refPrice) * 100) / 100;
      const changePercent = refPrice !== 0
        ? Math.round(((newValue - refPrice) / refPrice) * 10000) / 100
        : 0;

      const { error } = await serviceClient
        .from('market_data')
        .update({
          value: newValue,
          change,
          change_percent: changePercent,
          // Provenance ecrite uniquement si la source la fournit reellement.
          ...(source ? { source } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq('id', current.id);

      if (error) {
        results.push({ symbol, status: 'error', error: error.message });
      } else {
        results.push({ symbol, status: 'updated', value: newValue });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      Sentry.captureException(err, { tags: { sync: 'admin', symbol } });
      results.push({ symbol, status: 'error', error: message });
    }
  }

  revalidatePath('/');
  revalidatePath('/marches');

  const updated = results.filter((r) => r.status === 'updated').length;
  const errors = results.filter((r) => r.status === 'error').length;

  return NextResponse.json({
    success: true,
    summary: { updated, errors, total: results.length },
    results,
    timestamp: new Date().toISOString(),
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifyBearerSecret } from '@/lib/secret-compare';
import { createServiceClient } from '@/lib/supabase';
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
 * Cron endpoint: fetches live market data from external APIs
 * and updates the market_data table in Supabase.
 *
 * Tourne une fois par jour a 08:00 UTC (vercel.json). Le plan Vercel Hobby ne
 * permet qu'un passage quotidien par cron, d'ou cette frequence unique.
 * GET /api/cron/update-market-data
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

  const results: UpdateResult[] = [];

  // Fetch all sources in parallel
  const [forexResult, commoditiesResult, indicesResult, cryptoResult, brvmResult] =
    await Promise.allSettled([
      dataOrchestrator.getForexData(),
      dataOrchestrator.getCommoditiesData(),
      dataOrchestrator.getIndicesData(),
      dataOrchestrator.getCryptoData(),
      dataOrchestrator.getBRVMIndices(),
    ]);

  const { updates, echecs } = construireMisesAJourMarche(
    {
      forex: forexResult,
      commodities: commoditiesResult,
      indices: indicesResult,
      crypto: cryptoResult,
      brvm: brvmResult,
    },
    'cron',
  );
  for (const echec of echecs) {
    results.push({ symbol: echec.symbol, status: 'error', error: echec.error });
  }

  // Apply updates to market_data table
  for (const [symbol, { value: newValue, source }] of Object.entries(updates)) {
    try {
      // Get current row to calculate change from previous_close
      const { data: current } = await supabase
        .from('market_data')
        .select('id, value, previous_close')
        .eq('symbol', symbol)
        .single();

      if (!current) {
        results.push({ symbol, status: 'skipped', error: 'Symbol not found in market_data' });
        continue;
      }

      // previous_close est realigne chaque nuit a minuit par le cron
      // reset-market-close, de sorte que change et change_percent mesurent bien
      // la variation de la journee. Cette remise a niveau a longtemps echoue en
      // silence (fonction SQL sans clause WHERE, refusee par pg-safeupdate) : la
      // « variation du jour » affichee etait alors une derive cumulee sur des
      // mois. Corrige par la migration 00024.
      const refPrice = Number(current.previous_close) || Number(current.value);
      const change = Math.round((newValue - refPrice) * 100) / 100;
      const changePercent = refPrice !== 0
        ? Math.round(((newValue - refPrice) / refPrice) * 10000) / 100
        : 0;

      const { error } = await supabase
        .from('market_data')
        .update({
          value: newValue,
          change,
          change_percent: changePercent,
          // La provenance n'est ecrite que si la source la fournit reellement :
          // on n'invente pas une attribution que l'on ne peut pas attester.
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
      Sentry.captureException(err, { tags: { cron: 'update-market-data', symbol } });
      results.push({ symbol, status: 'error', error: message });
    }
  }

  // Revalidate pages that display market data
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

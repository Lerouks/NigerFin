import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin-auth';
import { dataOrchestrator } from '@/lib/services/data-orchestrator';
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

  const updates: Record<string, number> = {};

  if (forexResult.status === 'fulfilled') {
    const rates = forexResult.value.data.rates;
    const eurXof = rates.find((r) => r.base === 'EUR' && r.target === 'XOF');
    if (eurXof) updates['EUR/XOF'] = eurXof.rateInXOF;
    const usdXof = rates.find((r) => r.base === 'USD' && r.target === 'XOF');
    if (usdXof) updates['USD/XOF'] = usdXof.rateInXOF;
  } else {
    Sentry.captureException(forexResult.reason, { tags: { sync: 'admin', source: 'forex' } });
    results.push({ symbol: 'EUR/XOF', status: 'error', error: String(forexResult.reason) });
    results.push({ symbol: 'USD/XOF', status: 'error', error: String(forexResult.reason) });
  }

  if (commoditiesResult.status === 'fulfilled') {
    const commodities = commoditiesResult.value.data.commodities;
    for (const c of commodities) {
      if (c.symbol === 'XAU') updates['XAU'] = c.price;
      if (c.symbol === 'ICEEUR:BRN1!' || c.name.toLowerCase().includes('brent')) updates['ICEEUR:BRN1!'] = c.price;
      if (c.symbol === 'U3O8') updates['U3O8'] = c.price;
    }
  } else {
    Sentry.captureException(commoditiesResult.reason, { tags: { sync: 'admin', source: 'commodities' } });
    results.push({ symbol: 'XAU', status: 'error', error: String(commoditiesResult.reason) });
    results.push({ symbol: 'ICEEUR:BRN1!', status: 'error', error: String(commoditiesResult.reason) });
    results.push({ symbol: 'U3O8', status: 'error', error: String(commoditiesResult.reason) });
  }

  if (indicesResult.status === 'fulfilled') {
    const quotes = indicesResult.value.data.quotes;
    for (const q of quotes) {
      if (q.symbol === 'IXIC') updates['IXIC'] = q.price;
      if (q.symbol === 'GSPC') updates['GSPC'] = q.price;
      if (q.symbol === 'SXXP') updates['SXXP'] = q.price;
    }
  } else {
    Sentry.captureException(indicesResult.reason, { tags: { sync: 'admin', source: 'indices' } });
    results.push({ symbol: 'IXIC', status: 'error', error: String(indicesResult.reason) });
    results.push({ symbol: 'GSPC', status: 'error', error: String(indicesResult.reason) });
    results.push({ symbol: 'SXXP', status: 'error', error: String(indicesResult.reason) });
  }

  if (cryptoResult.status === 'fulfilled') {
    const prices = cryptoResult.value.data.prices;
    for (const p of prices) {
      if (p.symbol === 'BTC') updates['BTC'] = p.price;
      if (p.symbol === 'ETH') updates['ETH'] = p.price;
    }
  } else {
    Sentry.captureException(cryptoResult.reason, { tags: { sync: 'admin', source: 'crypto' } });
    results.push({ symbol: 'BTC', status: 'error', error: String(cryptoResult.reason) });
    results.push({ symbol: 'ETH', status: 'error', error: String(cryptoResult.reason) });
  }

  if (brvmResult.status === 'fulfilled') {
    const indices = brvmResult.value.data;
    const composite = indices.find((i) => i.name.includes('Composite'));
    if (composite) updates['BRVMC'] = composite.value;
  } else {
    Sentry.captureException(brvmResult.reason, { tags: { sync: 'admin', source: 'brvm' } });
    results.push({ symbol: 'BRVMC', status: 'error', error: String(brvmResult.reason) });
  }

  for (const [symbol, newValue] of Object.entries(updates)) {
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

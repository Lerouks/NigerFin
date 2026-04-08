import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createServiceClient } from '@/lib/supabase';
import { dataOrchestrator } from '@/lib/services/data-orchestrator';
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
 * Runs every hour from 7h to 23h UTC (configured in vercel.json).
 * GET /api/cron/update-market-data
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
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

  // Build a map of symbol → new value
  const updates: Record<string, number> = {};

  // --- Forex ---
  if (forexResult.status === 'fulfilled') {
    const rates = forexResult.value.data.rates;
    // EUR/XOF: fixed rate
    const eurXof = rates.find((r) => r.base === 'EUR' && r.target === 'XOF');
    if (eurXof) updates['EUR/XOF'] = eurXof.rateInXOF;
    // USD/XOF
    const usdXof = rates.find((r) => r.base === 'USD' && r.target === 'XOF');
    if (usdXof) updates['USD/XOF'] = usdXof.rateInXOF;
  } else {
    Sentry.captureException(forexResult.reason, { tags: { cron: 'update-market-data', source: 'forex' } });
    results.push({ symbol: 'EUR/XOF', status: 'error', error: String(forexResult.reason) });
    results.push({ symbol: 'USD/XOF', status: 'error', error: String(forexResult.reason) });
  }

  // --- Commodities ---
  if (commoditiesResult.status === 'fulfilled') {
    const commodities = commoditiesResult.value.data.commodities;
    for (const c of commodities) {
      if (c.symbol === 'XAU') updates['XAU'] = c.price;
      if (c.symbol === 'ICEEUR:BRN1!' || c.name.toLowerCase().includes('brent')) updates['ICEEUR:BRN1!'] = c.price;
      if (c.symbol === 'U3O8') updates['U3O8'] = c.price;
    }
  } else {
    Sentry.captureException(commoditiesResult.reason, { tags: { cron: 'update-market-data', source: 'commodities' } });
    results.push({ symbol: 'XAU', status: 'error', error: String(commoditiesResult.reason) });
    results.push({ symbol: 'ICEEUR:BRN1!', status: 'error', error: String(commoditiesResult.reason) });
    results.push({ symbol: 'U3O8', status: 'error', error: String(commoditiesResult.reason) });
  }

  // --- Indices ---
  if (indicesResult.status === 'fulfilled') {
    const quotes = indicesResult.value.data.quotes;
    for (const q of quotes) {
      if (q.symbol === 'IXIC') updates['IXIC'] = q.price;
      if (q.symbol === 'GSPC') updates['GSPC'] = q.price;
      if (q.symbol === 'SXXP') updates['SXXP'] = q.price;
    }
  } else {
    Sentry.captureException(indicesResult.reason, { tags: { cron: 'update-market-data', source: 'indices' } });
    results.push({ symbol: 'IXIC', status: 'error', error: String(indicesResult.reason) });
    results.push({ symbol: 'GSPC', status: 'error', error: String(indicesResult.reason) });
    results.push({ symbol: 'SXXP', status: 'error', error: String(indicesResult.reason) });
  }

  // --- Crypto ---
  if (cryptoResult.status === 'fulfilled') {
    const prices = cryptoResult.value.data.prices;
    for (const p of prices) {
      if (p.symbol === 'BTC') updates['BTC'] = p.price;
      if (p.symbol === 'ETH') updates['ETH'] = p.price;
    }
  } else {
    Sentry.captureException(cryptoResult.reason, { tags: { cron: 'update-market-data', source: 'crypto' } });
    results.push({ symbol: 'BTC', status: 'error', error: String(cryptoResult.reason) });
    results.push({ symbol: 'ETH', status: 'error', error: String(cryptoResult.reason) });
  }

  // --- BRVM ---
  if (brvmResult.status === 'fulfilled') {
    const indices = brvmResult.value.data;
    const composite = indices.find((i) => i.name.includes('Composite'));
    if (composite) updates['BRVMC'] = composite.value;
  } else {
    Sentry.captureException(brvmResult.reason, { tags: { cron: 'update-market-data', source: 'brvm' } });
    results.push({ symbol: 'BRVMC', status: 'error', error: String(brvmResult.reason) });
  }

  // Apply updates to market_data table
  for (const [symbol, newValue] of Object.entries(updates)) {
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

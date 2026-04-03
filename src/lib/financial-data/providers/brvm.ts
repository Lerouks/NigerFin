/**
 * BRVM Provider
 *
 * Fetches indices from the Bourse Régionale des Valeurs Mobilières (West Africa).
 */

import type { RawQuote } from '../types';

/**
 * Fetch BRVM Composite index.
 * @param _ticker - 'composite' (only supported ticker for now)
 */
export async function fetchBRVMQuote(_ticker: string): Promise<RawQuote> {
  const res = await fetch('https://www.brvm.org/api/quotes', {
    signal: AbortSignal.timeout(15_000),
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`BRVM API returned HTTP ${res.status}`);
  }

  const json = await res.json();
  const data = json as Record<string, unknown>;
  const rawIndices = (data.indices || []) as Array<Record<string, unknown>>;

  const composite = rawIndices.find(
    (idx) => typeof idx.name === 'string' && idx.name.includes('Composite'),
  );

  if (!composite) {
    throw new Error('BRVM: no Composite index in response');
  }

  const value = Number(composite.value || composite.close || 0);
  if (value <= 0) {
    throw new Error('BRVM: invalid Composite value');
  }

  const change = Number(composite.change || 0);
  const changePercent = Number(composite.changePercent || 0);

  // Use the date from the response, or fail if absent
  const dateStr = composite.date as string | undefined;
  if (!dateStr) {
    throw new Error('BRVM: no date for Composite index — cannot validate freshness');
  }

  return {
    price: Math.round(value * 100) / 100,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100,
    marketTime: new Date(dateStr).toISOString(),
    source: 'BRVM',
  };
}

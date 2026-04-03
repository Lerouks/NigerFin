'use client';

/**
 * Unified Financial Data Hook
 *
 * RULE 1: Single source — replaces useForex, useCommodities, useCrypto,
 * useIndices, and useBRVMIndices with one hook that fetches from
 * the centralized /api/financial-data endpoint.
 */

import useSWR from 'swr';
import type { FinancialQuote, FinancialDataError, AssetType } from '@/lib/financial-data/types';

interface FinancialDataResponse {
  quotes: FinancialQuote[];
  errors: FinancialDataError[];
  fetchedAt: string;
}

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return res.json();
  });

interface UseFinancialDataOptions {
  /** Filter by asset types (default: fetch all) */
  types?: AssetType[];
  /** Deduplication interval in ms (default: 5 min) */
  dedupingInterval?: number;
}

export function useFinancialData(options?: UseFinancialDataOptions) {
  const typesParam = options?.types?.join(',');
  const url = typesParam
    ? `/api/financial-data?types=${typesParam}`
    : '/api/financial-data';

  const { data, error, isLoading, mutate } = useSWR<FinancialDataResponse>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: options?.dedupingInterval ?? 300_000, // 5 min
      errorRetryCount: 2,
      keepPreviousData: true,
    },
  );

  return {
    quotes: data?.quotes ?? [],
    errors: data?.errors ?? [],
    isLoading,
    error: error ?? null,
    fetchedAt: data?.fetchedAt ?? null,
    refresh: mutate,
  };
}

/**
 * Get quotes filtered by type from the hook result.
 */
export function filterQuotesByType(
  quotes: FinancialQuote[],
  type: AssetType,
): FinancialQuote[] {
  return quotes.filter((q) => q.type === type);
}

/**
 * Group quotes by type for display.
 */
export function groupQuotesByType(
  quotes: FinancialQuote[],
): Record<AssetType, FinancialQuote[]> {
  const groups: Record<string, FinancialQuote[]> = {};
  for (const q of quotes) {
    if (!groups[q.type]) groups[q.type] = [];
    groups[q.type].push(q);
  }
  return groups as Record<AssetType, FinancialQuote[]>;
}

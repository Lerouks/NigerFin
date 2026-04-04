'use client';

/**
 * Hook to fetch market data from the admin-managed Supabase table
 * via /api/market-data (public, read-only endpoint).
 */

import useSWR from 'swr';
import type { MarketData } from '@/types';

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return res.json();
  });

export type MarketDataType = 'currency' | 'commodity' | 'index' | 'crypto';

export function useMarketData() {
  const { data, error, isLoading, mutate } = useSWR<MarketData[]>(
    '/api/market-data',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300_000, // 5 min
      errorRetryCount: 2,
      keepPreviousData: true,
    },
  );

  return {
    items: data ?? [],
    isLoading,
    error: error ?? null,
    refresh: mutate,
  };
}

export function groupByType(
  items: MarketData[],
): Record<MarketDataType, MarketData[]> {
  const groups: Record<string, MarketData[]> = {};
  for (const item of items) {
    if (!groups[item.type]) groups[item.type] = [];
    groups[item.type].push(item);
  }
  return groups as Record<MarketDataType, MarketData[]>;
}

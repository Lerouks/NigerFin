'use client';

import useSWR from 'swr';
import type { BRVMIndex } from '@/lib/services/brvm-scraper-service';

interface BRVMIndicesResponse {
  indices: BRVMIndex[];
  source: 'api' | 'cache';
  service: string;
  fetchedAt: string;
}

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
});

export function useBRVMIndices() {
  const { data, error, isLoading, mutate } = useSWR<BRVMIndicesResponse>(
    '/api/markets/brvm/indices',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 1800000, // 30 min
      errorRetryCount: 2,
      keepPreviousData: true,
    }
  );

  return {
    data: data?.indices || null,
    isLoading,
    error: error || null,
    lastUpdated: data?.fetchedAt || null,
    source: data?.service || null,
    refresh: mutate,
  };
}

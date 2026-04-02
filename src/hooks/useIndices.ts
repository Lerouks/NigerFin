'use client';

import useSWR from 'swr';
import type { IndexQuote } from '@/lib/services/indices-service';

interface IndicesResponse {
  quotes: IndexQuote[];
  date: string;
  source: 'api' | 'cache';
  service: string;
  fetchedAt: string;
}

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
});

export function useIndices() {
  const { data, error, isLoading, mutate } = useSWR<IndicesResponse>(
    '/api/markets/indices',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 900000, // 15 min
      errorRetryCount: 2,
      keepPreviousData: true,
    }
  );

  return {
    data: data?.quotes || null,
    isLoading,
    error: error || null,
    lastUpdated: data?.fetchedAt || null,
    source: data?.service || null,
    refresh: mutate,
  };
}

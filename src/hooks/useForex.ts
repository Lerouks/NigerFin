'use client';

import useSWR from 'swr';
import type { ForexRate } from '@/lib/services/frankfurter-service';

interface ForexResponse {
  rates: ForexRate[];
  baseCurrency: string;
  date: string;
  source: 'api' | 'cache';
  service: string;
  fetchedAt: string;
}

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
});

export function useForex() {
  const { data, error, isLoading, mutate } = useSWR<ForexResponse>(
    '/api/markets/forex',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 3600000, // 1h
      errorRetryCount: 2,
      keepPreviousData: true,
    }
  );

  return {
    data: data?.rates || null,
    isLoading,
    error: error || null,
    lastUpdated: data?.fetchedAt || null,
    source: data?.service || null,
    refresh: mutate,
  };
}

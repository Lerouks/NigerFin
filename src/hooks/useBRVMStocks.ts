'use client';

import useSWR from 'swr';
import type { BRVMStock } from '@/lib/services/brvm-scraper-service';

interface BRVMStocksResponse {
  stocks: BRVMStock[];
  source: 'api' | 'cache';
  service: string;
  fetchedAt: string;
}

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
});

export function useBRVMStocks(ticker?: string) {
  const url = ticker
    ? `/api/markets/brvm/stocks?ticker=${encodeURIComponent(ticker)}`
    : '/api/markets/brvm/stocks';

  const { data, error, isLoading, mutate } = useSWR<BRVMStocksResponse>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 1800000, // 30 min
      errorRetryCount: 2,
      keepPreviousData: true,
    }
  );

  return {
    data: data?.stocks || null,
    isLoading,
    error: error || null,
    lastUpdated: data?.fetchedAt || null,
    source: data?.service || null,
    refresh: mutate,
  };
}

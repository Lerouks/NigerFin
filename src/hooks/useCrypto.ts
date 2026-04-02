'use client';

import useSWR from 'swr';
import type { CryptoPrice } from '@/lib/services/crypto-service';

interface CryptoResponse {
  prices: CryptoPrice[];
  date: string;
  source: 'api' | 'cache';
  service: string;
  fetchedAt: string;
}

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
});

export function useCrypto() {
  const { data, error, isLoading, mutate } = useSWR<CryptoResponse>(
    '/api/markets/crypto',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 min
      errorRetryCount: 2,
      keepPreviousData: true,
    }
  );

  return {
    data: data?.prices || null,
    isLoading,
    error: error || null,
    lastUpdated: data?.fetchedAt || null,
    source: data?.service || null,
    refresh: mutate,
  };
}

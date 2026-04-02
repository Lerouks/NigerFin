'use client';

import useSWR from 'swr';
import type { CommodityPrice } from '@/lib/services/commodities-service';

interface CommoditiesResponse {
  commodities: CommodityPrice[];
  date: string;
  source: 'api' | 'cache';
  service: string;
  fetchedAt: string;
}

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
});

export function useCommodities() {
  const { data, error, isLoading, mutate } = useSWR<CommoditiesResponse>(
    '/api/economy/commodities',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 3600000, // 1h
      errorRetryCount: 2,
      keepPreviousData: true,
    }
  );

  return {
    data: data?.commodities || null,
    isLoading,
    error: error || null,
    lastUpdated: data?.fetchedAt || null,
    source: data?.service || null,
    refresh: mutate,
  };
}

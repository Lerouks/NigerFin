'use client';

import useSWR from 'swr';
import type { ECOWASData } from '@/lib/services/ecowas-service';

interface RegionResponse {
  region: ECOWASData;
  source: 'api' | 'cache';
  service: string;
  fetchedAt: string;
}

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
});

export function useRegionData() {
  const { data, error, isLoading, mutate } = useSWR<RegionResponse>(
    '/api/countries/region',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 604800000, // 7 days
      errorRetryCount: 2,
      keepPreviousData: true,
    }
  );

  return {
    data: data?.region || null,
    isLoading,
    error: error || null,
    lastUpdated: data?.fetchedAt || null,
    source: data?.service || null,
    refresh: mutate,
  };
}

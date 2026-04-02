'use client';

import useSWR from 'swr';
import type { MacroData } from '@/lib/services/world-bank-service';
import type { IMFData } from '@/lib/services/imf-service';

interface MacroResponse {
  worldBank: MacroData;
  imf: IMFData;
  source: 'api' | 'cache';
  service: string;
  fetchedAt: string;
}

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
});

export function useNigerMacro() {
  const { data, error, isLoading, mutate } = useSWR<MacroResponse>(
    '/api/economy/macro',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 86400000, // 24h
      errorRetryCount: 2,
      keepPreviousData: true,
    }
  );

  return {
    data: data ? { worldBank: data.worldBank, imf: data.imf } : null,
    isLoading,
    error: error || null,
    lastUpdated: data?.fetchedAt || null,
    source: data?.service || null,
    refresh: mutate,
  };
}

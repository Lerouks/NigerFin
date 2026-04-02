'use client';

import useSWR from 'swr';
import type { CountryData } from '@/lib/services/rest-countries-service';

interface CountryResponse {
  country: CountryData;
  source: 'api' | 'cache';
  service: string;
  fetchedAt: string;
}

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
});

export function useNigerCountry() {
  const { data, error, isLoading, mutate } = useSWR<CountryResponse>(
    '/api/countries/niger',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 604800000, // 7 days
      errorRetryCount: 2,
      keepPreviousData: true,
    }
  );

  return {
    data: data?.country || null,
    isLoading,
    error: error || null,
    lastUpdated: data?.fetchedAt || null,
    source: data?.service || null,
    refresh: mutate,
  };
}

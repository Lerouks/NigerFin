'use client';

import useSWR, { type SWRConfiguration, type SWRResponse } from 'swr';

async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'same-origin' });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API ${url} a renvoyé ${res.status}${body ? `: ${body.slice(0, 120)}` : ''}`);
  }
  return res.json() as Promise<T>;
}

export function useAdminApi<T>(
  path: string | null,
  options?: SWRConfiguration<T>
): SWRResponse<T> {
  const key = path ? (path.startsWith('/api/admin') ? path : `/api/admin/${path.replace(/^\/+/, '')}`) : null;
  return useSWR<T>(key, fetcher<T>, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 5000,
    ...options,
  });
}

export function useAdminApiPolling<T>(
  path: string | null,
  intervalMs = 30000,
  options?: SWRConfiguration<T>
): SWRResponse<T> {
  return useAdminApi<T>(path, { refreshInterval: intervalMs, ...options });
}

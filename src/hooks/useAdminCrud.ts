'use client';

import { useState, useEffect, useCallback } from 'react';

interface UseAdminCrudOptions {
  endpoint: string;
  /** Optional query params appended to the fetch URL */
  params?: Record<string, string>;
}

interface UseAdminCrudReturn<T> {
  items: T[];
  loading: boolean;
  saving: boolean;
  setSaving: (v: boolean) => void;
  refresh: () => Promise<void>;
  create: (body: Record<string, unknown>) => Promise<boolean>;
  update: (body: Record<string, unknown>) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
}

export function useAdminCrud<T>({ endpoint, params }: UseAdminCrudOptions): UseAdminCrudReturn<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const qs = params
    ? '?' + new URLSearchParams(params).toString()
    : '';

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`${endpoint}${qs}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setItems(data);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [endpoint, qs]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(async (body: Record<string, unknown>): Promise<boolean> => {
    setSaving(true);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        await refresh();
        setSaving(false);
        return true;
      }
    } catch { /* ignore */ }
    setSaving(false);
    return false;
  }, [endpoint, refresh]);

  const update = useCallback(async (body: Record<string, unknown>): Promise<boolean> => {
    setSaving(true);
    try {
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        await refresh();
        setSaving(false);
        return true;
      }
    } catch { /* ignore */ }
    setSaving(false);
    return false;
  }, [endpoint, refresh]);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`${endpoint}?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        await refresh();
        return true;
      }
    } catch { /* ignore */ }
    return false;
  }, [endpoint, refresh]);

  return { items, loading, saving, setSaving, refresh, create, update, remove };
}

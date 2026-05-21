'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Eye, EyeOff, TrendingUp, Check } from 'lucide-react';

interface SiteFeaturesData {
  market_ticker_enabled: boolean;
  updated_at: string | null;
}

export function SiteFeaturesManager() {
  const [data, setData] = useState<SiteFeaturesData>({
    market_ticker_enabled: true,
    updated_at: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/site-features');
      if (res.ok) {
        const result = await res.json();
        setData({
          market_ticker_enabled: result.market_ticker_enabled !== false,
          updated_at: result.updated_at ?? null,
        });
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleMarketTicker = async () => {
    setSaving(true);
    setError('');
    const next = !data.market_ticker_enabled;
    try {
      const res = await fetch('/api/admin/site-features', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ market_ticker_enabled: next }),
      });
      if (res.ok) {
        const result = await res.json();
        setData({
          market_ticker_enabled: result.market_ticker_enabled !== false,
          updated_at: result.updated_at ?? null,
        });
        setSavedAt(Date.now());
        window.setTimeout(() => setSavedAt(null), 2500);
      } else {
        setError('Erreur lors de la mise à jour');
      }
    } catch {
      setError('Erreur réseau');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-semibold text-[#111] tracking-tight">Visibilité du site</h2>
        <p className="text-[14px] text-gray-500 mt-2">
          Active ou masque des éléments visibles sur le site public, sans toucher au code.
        </p>
      </div>

      {/* Market ticker toggle */}
      <article className="bg-white border border-black/[0.08] rounded-2xl p-6 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.08)]">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-semibold text-[#111] leading-snug">
              Bandeau marchés défilant (home)
            </h3>
            <p className="text-[13px] text-gray-600 mt-1 leading-relaxed">
              Le ruban noir en haut de la page d&apos;accueil avec les cours BRVM, devises et matières premières qui défilent en continu.
            </p>
          </div>
          <button
            type="button"
            onClick={toggleMarketTicker}
            disabled={saving}
            aria-pressed={data.market_ticker_enabled}
            className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors duration-200 disabled:opacity-50 ${
              data.market_ticker_enabled ? 'bg-emerald-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                data.market_ticker_enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-black/[0.05] flex items-center justify-between gap-3 text-[12px]">
          <span className="inline-flex items-center gap-1.5 text-gray-500">
            {data.market_ticker_enabled ? (
              <>
                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                Visible sur la home
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5 text-gray-500" />
                Masqué actuellement
              </>
            )}
          </span>
          {savedAt && (
            <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
              <Check className="w-3.5 h-3.5" />
              Enregistré
            </span>
          )}
        </div>
      </article>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-[13px] text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Eye, EyeOff, TrendingUp, Check, Rocket, Users } from 'lucide-react';

interface SiteFeaturesData {
  market_ticker_enabled: boolean;
  prelaunch_enabled: boolean;
  waitlist_count: number;
  updated_at: string | null;
}

type FeaturePatch = {
  market_ticker_enabled?: boolean;
  prelaunch_enabled?: boolean;
};

export function SiteFeaturesManager() {
  const [data, setData] = useState<SiteFeaturesData>({
    market_ticker_enabled: true,
    prelaunch_enabled: false,
    waitlist_count: 0,
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
          prelaunch_enabled: result.prelaunch_enabled === true,
          waitlist_count: result.waitlist_count ?? 0,
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

  const saveFeature = async (patch: FeaturePatch) => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/site-features', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        const result = await res.json();
        setData((prev) => ({
          ...prev,
          market_ticker_enabled: result.market_ticker_enabled !== false,
          prelaunch_enabled: result.prelaunch_enabled === true,
          updated_at: result.updated_at ?? null,
        }));
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

  const toggleMarketTicker = () =>
    saveFeature({ market_ticker_enabled: !data.market_ticker_enabled });
  const togglePrelaunch = () =>
    saveFeature({ prelaunch_enabled: !data.prelaunch_enabled });

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
      <article className="bg-white border border-black/8 rounded-2xl p-6 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.08)]">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
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
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 disabled:opacity-50 ${
              data.market_ticker_enabled ? 'bg-emerald-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition-transform duration-200 ${
                data.market_ticker_enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-black/5 flex items-center justify-between gap-3 text-[12px]">
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

      {/* Mode pré-lancement */}
      <article className="bg-white border border-black/8 rounded-2xl p-6 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.08)]">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
            <Rocket className="w-5 h-5 text-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-semibold text-[#111] leading-snug">
              Mode pré-lancement
            </h3>
            <p className="text-[13px] text-gray-600 mt-1 leading-relaxed">
              Quand il est actif, le public voit une page «&nbsp;Prochainement&nbsp;» avec inscription à la liste de lancement. Toi et Ibrahim, une fois connectés, voyez le site complet pour le tester. À couper le jour du lancement.
            </p>
          </div>
          <button
            type="button"
            onClick={togglePrelaunch}
            disabled={saving}
            aria-pressed={data.prelaunch_enabled}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 disabled:opacity-50 ${
              data.prelaunch_enabled ? 'bg-amber-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition-transform duration-200 ${
                data.prelaunch_enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-black/5 flex items-center justify-between gap-3 text-[12px]">
          <span className="inline-flex items-center gap-1.5">
            {data.prelaunch_enabled ? (
              <span className="inline-flex items-center gap-1.5 text-amber-700 font-medium">
                <EyeOff className="w-3.5 h-3.5" />
                Site masqué au public (page Prochainement)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-emerald-600">
                <Eye className="w-3.5 h-3.5" />
                Site en ligne pour tout le monde
              </span>
            )}
          </span>
          <span className="inline-flex items-center gap-1.5 text-gray-500">
            <Users className="w-3.5 h-3.5" />
            {data.waitlist_count} inscrit{data.waitlist_count > 1 ? 's' : ''} à la liste
          </span>
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

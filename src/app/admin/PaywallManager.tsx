'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Check, Eye, MousePointerClick, X as XIcon, BarChart3, Clock, ArrowRight, Users, TrendingUp } from 'lucide-react';

interface PaywallConfig {
  enabled: boolean;
  trigger_type: 'scroll' | 'time' | 'both';
  scroll_percent: number;
  delay_seconds: number;
  title: string;
  message: string;
  cta_subscribe_text: string;
  cta_login_text: string;
  cta_dismiss_text: string;
  dismiss_cookie_hours: number;
  show_article_counter: boolean;
  counter_message: string;
  bg_color: string;
  text_color: string;
  cta_bg_color: string;
  cta_text_color: string;
}

interface AnalyticsSummary {
  period_days: number;
  views: number;
  click_primary: number;
  click_secondary: number;
  click_subscribe: number;
  click_login: number;
  continue_reading: number;
  dismiss: number;
  total: number;
  conversion_rate: string;
  avg_scroll_depth: number | null;
  avg_read_time_seconds: number | null;
  case_breakdown: Record<string, number>;
}

const CASE_LABELS: Record<string, string> = {
  not_connected: 'Non connecte',
  connected_has_articles: 'Connecte (articles restants)',
  connected_no_articles: 'Connecte (limite atteinte)',
  reader_has_articles: 'Lecteur (articles restants)',
  reader_no_articles: 'Lecteur (limite atteinte)',
};

export function PaywallManager() {
  const [config, setConfig] = useState<PaywallConfig | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const [cfgRes, anaRes] = await Promise.all([
        fetch('/api/admin/paywall'),
        fetch('/api/admin/paywall/analytics?days=30'),
      ]);
      if (cfgRes.ok) setConfig(await cfgRes.json());
      if (anaRes.ok) setAnalytics(await anaRes.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/paywall', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        const updated = await res.json();
        setConfig(updated);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        const err = await res.json().catch(() => ({ error: 'Erreur serveur' }));
        setError(err.error || 'Erreur lors de la sauvegarde');
      }
    } catch {
      setError('Erreur r\u00e9seau');
    }
    setSaving(false);
  };

  const update = <K extends keyof PaywallConfig>(key: K, value: PaywallConfig[K]) => {
    if (!config) return;
    setConfig({ ...config, [key]: value });
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
      </div>
    );
  }

  if (!config) {
    return <p className="text-center py-12 text-gray-400">Erreur de chargement de la configuration</p>;
  }

  return (
    <div className="space-y-6">
      {/* Enhanced analytics dashboard */}
      {analytics && (
        <div className="space-y-4">
          {/* Main KPI row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={<Eye className="w-4 h-4" />} label="Vues overlay" value={analytics.views} />
            <StatCard icon={<MousePointerClick className="w-4 h-4" />} label="Clics CTA" value={(analytics.click_primary || 0) + (analytics.click_secondary || 0) + (analytics.click_subscribe || 0) + (analytics.click_login || 0)} accent />
            <StatCard icon={<XIcon className="w-4 h-4" />} label="Fermetures" value={analytics.dismiss} />
            <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Taux conversion" value={`${analytics.conversion_rate}%`} accent />
          </div>

          {/* Secondary metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={<ArrowRight className="w-4 h-4" />} label="Continue lecture" value={analytics.continue_reading || 0} />
            <StatCard
              icon={<BarChart3 className="w-4 h-4" />}
              label="Scroll moyen"
              value={analytics.avg_scroll_depth !== null ? `${analytics.avg_scroll_depth}%` : '-'}
            />
            <StatCard
              icon={<Clock className="w-4 h-4" />}
              label="Temps lecture moy."
              value={analytics.avg_read_time_seconds !== null ? `${analytics.avg_read_time_seconds}s` : '-'}
            />
            <StatCard icon={<Users className="w-4 h-4" />} label="Total evenements" value={analytics.total} />
          </div>

          {/* Case breakdown */}
          {analytics.case_breakdown && Object.keys(analytics.case_breakdown).length > 0 && (
            <div className="bg-white rounded-xl border border-black/[0.06] p-5">
              <h4 className="text-[11px] uppercase tracking-wider text-gray-400 mb-3">Repartition par cas utilisateur</h4>
              <div className="space-y-2">
                {Object.entries(analytics.case_breakdown)
                  .sort(([, a], [, b]) => b - a)
                  .map(([caseId, count]) => {
                    const total = Object.values(analytics.case_breakdown).reduce((s, v) => s + v, 0);
                    const percent = total > 0 ? ((count / total) * 100).toFixed(1) : '0';
                    return (
                      <div key={caseId} className="flex items-center gap-3">
                        <span className="text-[12px] text-gray-600 w-48 truncate">
                          {CASE_LABELS[caseId] || caseId}
                        </span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="text-[12px] text-gray-500 font-medium w-16 text-right">
                          {count} ({percent}%)
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl border border-black/[0.06] p-6 space-y-6">
        {/* Enable toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Paywall overlay</h3>
            <p className="text-[12px] text-gray-400 mt-0.5">Affiche un overlay incitatif aux non-abonnes</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => update('enabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
          </label>
        </div>

        <hr className="border-black/[0.04]" />

        {/* Trigger settings */}
        <div>
          <h4 className="text-[11px] uppercase tracking-wider text-gray-400 mb-3">Declenchement</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] text-gray-400 uppercase tracking-wider block mb-1">Mode</label>
              <select
                value={config.trigger_type}
                onChange={(e) => update('trigger_type', e.target.value as PaywallConfig['trigger_type'])}
                className="w-full border border-black/[0.08] rounded-lg px-3 py-2 text-sm bg-[#fafaf9] focus:outline-none"
              >
                <option value="scroll">Scroll uniquement</option>
                <option value="time">Temps uniquement</option>
                <option value="both">Scroll ou temps (premier atteint)</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-gray-400 uppercase tracking-wider block mb-1">Seuil scroll (%)</label>
              <input
                type="number"
                min={10}
                max={100}
                value={config.scroll_percent}
                onChange={(e) => update('scroll_percent', parseInt(e.target.value) || 50)}
                className="w-full border border-black/[0.08] rounded-lg px-3 py-2 text-sm bg-[#fafaf9] focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
            <div>
              <label className="text-[11px] text-gray-400 uppercase tracking-wider block mb-1">Delai (secondes)</label>
              <input
                type="number"
                min={1}
                max={60}
                value={config.delay_seconds}
                onChange={(e) => update('delay_seconds', parseInt(e.target.value) || 3)}
                className="w-full border border-black/[0.08] rounded-lg px-3 py-2 text-sm bg-[#fafaf9] focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
          </div>
        </div>

        <hr className="border-black/[0.04]" />

        {/* Content */}
        <div>
          <h4 className="text-[11px] uppercase tracking-wider text-gray-400 mb-3">Contenu (overlay legacy)</h4>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-gray-400 uppercase tracking-wider block mb-1">Titre</label>
              <input
                type="text"
                value={config.title}
                onChange={(e) => update('title', e.target.value)}
                className="w-full border border-black/[0.08] rounded-lg px-3 py-2 text-sm bg-[#fafaf9] focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
            <div>
              <label className="text-[11px] text-gray-400 uppercase tracking-wider block mb-1">Message</label>
              <textarea
                value={config.message}
                onChange={(e) => update('message', e.target.value)}
                rows={2}
                className="w-full border border-black/[0.08] rounded-lg px-3 py-2 text-sm bg-[#fafaf9] focus:outline-none focus:ring-1 focus:ring-black resize-none"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-gray-400 uppercase tracking-wider block mb-1">Bouton abonnement</label>
                <input
                  type="text"
                  value={config.cta_subscribe_text}
                  onChange={(e) => update('cta_subscribe_text', e.target.value)}
                  className="w-full border border-black/[0.08] rounded-lg px-3 py-2 text-sm bg-[#fafaf9] focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
              <div>
                <label className="text-[11px] text-gray-400 uppercase tracking-wider block mb-1">Lien connexion</label>
                <input
                  type="text"
                  value={config.cta_login_text}
                  onChange={(e) => update('cta_login_text', e.target.value)}
                  className="w-full border border-black/[0.08] rounded-lg px-3 py-2 text-sm bg-[#fafaf9] focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
              <div>
                <label className="text-[11px] text-gray-400 uppercase tracking-wider block mb-1">Bouton fermer</label>
                <input
                  type="text"
                  value={config.cta_dismiss_text}
                  onChange={(e) => update('cta_dismiss_text', e.target.value)}
                  className="w-full border border-black/[0.08] rounded-lg px-3 py-2 text-sm bg-[#fafaf9] focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
            </div>
          </div>
        </div>

        <hr className="border-black/[0.04]" />

        {/* Counter */}
        <div>
          <h4 className="text-[11px] uppercase tracking-wider text-gray-400 mb-3">Compteur d&apos;articles</h4>
          <div className="flex items-center gap-4 mb-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.show_article_counter}
                onChange={(e) => update('show_article_counter', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600" />
            </label>
            <span className="text-sm text-gray-600">Afficher le compteur</span>
          </div>
          <div>
            <label className="text-[11px] text-gray-400 uppercase tracking-wider block mb-1">
              Message compteur <span className="normal-case">(utiliser {'{remaining}'} pour le nombre)</span>
            </label>
            <input
              type="text"
              value={config.counter_message}
              onChange={(e) => update('counter_message', e.target.value)}
              className="w-full border border-black/[0.08] rounded-lg px-3 py-2 text-sm bg-[#fafaf9] focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>
        </div>

        <hr className="border-black/[0.04]" />

        {/* Appearance */}
        <div>
          <h4 className="text-[11px] uppercase tracking-wider text-gray-400 mb-3">Apparence</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <ColorField label="Fond overlay" value={config.bg_color} onChange={(v) => update('bg_color', v)} />
            <ColorField label="Texte overlay" value={config.text_color} onChange={(v) => update('text_color', v)} />
            <ColorField label="Fond bouton" value={config.cta_bg_color} onChange={(v) => update('cta_bg_color', v)} />
            <ColorField label="Texte bouton" value={config.cta_text_color} onChange={(v) => update('cta_text_color', v)} />
          </div>
          <div className="mt-3">
            <label className="text-[11px] text-gray-400 uppercase tracking-wider block mb-1">Duree cookie dismiss (heures)</label>
            <input
              type="number"
              min={1}
              max={720}
              value={config.dismiss_cookie_hours}
              onChange={(e) => update('dismiss_cookie_hours', parseInt(e.target.value) || 24)}
              className="w-40 border border-black/[0.08] rounded-lg px-3 py-2 text-sm bg-[#fafaf9] focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>
        </div>

        {/* Premium Overlay info */}
        <hr className="border-black/[0.04]" />
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">Systeme d&apos;overlay intelligent</h4>
          <p className="text-[13px] text-blue-700 leading-relaxed mb-3">
            Le nouveau systeme d&apos;overlay s&apos;adapte automatiquement au statut de chaque utilisateur.
            Les textes et comportements sont geres directement dans le composant PremiumOverlay.
          </p>
          <div className="space-y-1.5 text-[12px] text-blue-600">
            <p><strong>Non connecte :</strong> Overlay bloquant a 30% du scroll, incitation a l&apos;inscription</p>
            <p><strong>Connecte (articles restants) :</strong> Overlay leger a 40%, compteur d&apos;articles</p>
            <p><strong>Connecte (limite atteinte) :</strong> Overlay bloquant, incitation Premium</p>
            <p><strong>Lecteur (articles restants) :</strong> Overlay leger a 40%, compteur</p>
            <p><strong>Lecteur (limite atteinte) :</strong> Overlay bloquant, upgrade Premium</p>
            <p><strong>Premium / Admin :</strong> Aucun overlay</p>
          </div>
        </div>

        {/* Preview */}
        <hr className="border-black/[0.04]" />
        <div>
          <h4 className="text-[11px] uppercase tracking-wider text-gray-400 mb-3">Apercu</h4>
          <div
            className="rounded-xl p-6 text-center max-w-md mx-auto"
            style={{ backgroundColor: config.bg_color, color: config.text_color }}
          >
            <h3 className="text-lg font-bold mb-2" style={{ color: config.text_color }}>{config.title}</h3>
            <p className="text-[13px] opacity-70 mb-4" style={{ color: config.text_color }}>{config.message}</p>
            {config.show_article_counter && (
              <p className="text-[11px] mb-3 opacity-60" style={{ color: config.text_color }}>
                {config.counter_message.replace('{remaining}', '2')}
              </p>
            )}
            <div className="flex flex-col gap-2 items-center">
              <span
                className="inline-block px-6 py-2.5 rounded-lg text-[13px] font-semibold"
                style={{ backgroundColor: config.cta_bg_color, color: config.cta_text_color }}
              >
                {config.cta_subscribe_text}
              </span>
              <span className="text-[12px] opacity-60 underline" style={{ color: config.text_color }}>
                {config.cta_login_text}
              </span>
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-[#111] text-white rounded-lg text-[13px] hover:bg-[#333] transition-colors disabled:opacity-30"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {saved ? 'Enregistre !' : 'Enregistrer'}
          </button>
          {error && <p className="text-red-500 text-[13px]">{error}</p>}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number | string; accent?: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-black/[0.06] p-4">
      <div className="flex items-center gap-2 mb-1">
        <span className={accent ? 'text-emerald-600' : 'text-gray-400'}>{icon}</span>
        <span className="text-[11px] uppercase tracking-wider text-gray-400">{label}</span>
      </div>
      <p className={`text-xl font-bold ${accent ? 'text-emerald-600' : ''}`}>{value}</p>
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-[11px] text-gray-400 uppercase tracking-wider block mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded border border-black/[0.08] cursor-pointer p-0"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 border border-black/[0.08] rounded-lg px-3 py-1.5 text-sm bg-[#fafaf9] focus:outline-none focus:ring-1 focus:ring-black font-mono"
        />
      </div>
    </div>
  );
}

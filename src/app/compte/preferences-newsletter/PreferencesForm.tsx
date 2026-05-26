'use client';

import { useState, useTransition } from 'react';
import { Check, Loader2 } from 'lucide-react';

export interface NewsletterPrefs {
  newsletter_monthly: boolean;
  newsletter_weekly: boolean;
  alerts_news: boolean;
  alerts_custom: boolean;
  reports_pdf: boolean;
}

interface ToggleConfig {
  key: keyof NewsletterPrefs;
  title: string;
  description: string;
  premium?: boolean;
}

const TOGGLES: ToggleConfig[] = [
  {
    key: 'newsletter_weekly',
    title: 'Premium Briefing du lundi',
    description: 'Le briefing hebdomadaire envoyé chaque lundi à 7h GMT : marchés, analyses, digest.',
    premium: true,
  },
  {
    key: 'newsletter_monthly',
    title: 'Digest mensuel',
    description: "Le récapitulatif mensuel des temps forts de l'économie Niger / UEMOA.",
  },
  {
    key: 'alerts_news',
    title: 'Alertes actualités majeures',
    description: "Notifications par email lors d'un événement marquant (BCEAO, BRVM, mobile money, fiscalité).",
  },
  {
    key: 'alerts_custom',
    title: 'Alertes personnalisées',
    description: 'Alertes ciblées sur vos thématiques préférées (à venir).',
    premium: true,
  },
  {
    key: 'reports_pdf',
    title: 'Rapports PDF trimestriels',
    description: "Réception automatique du rapport PDF complet à chaque fin de trimestre.",
    premium: true,
  },
];

export function PreferencesForm({ initial }: { initial: NewsletterPrefs }) {
  const [prefs, setPrefs] = useState<NewsletterPrefs>(initial);
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggle(key: keyof NewsletterPrefs) {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    save(next);
  }

  function save(next: NewsletterPrefs) {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch('/api/user/newsletter-prefs', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(next),
        });
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { error?: string };
          setError(j.error ?? `Erreur ${res.status}`);
          return;
        }
        setSavedAt(Date.now());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur réseau');
      }
    });
  }

  const noneActive = !Object.values(prefs).some((v) => v);

  return (
    <div className="space-y-3">
      {TOGGLES.map((t) => {
        const checked = prefs[t.key];
        return (
          <label
            key={t.key}
            className={`flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition ${
              checked ? 'border-gold bg-gold/5' : 'border-neutral-200 bg-white hover:border-neutral-300'
            }`}
          >
            <span className="relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors"
                  style={{ backgroundColor: checked ? '#d4a843' : '#d4d4d4' }}>
              <span className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </span>
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggle(t.key)}
              className="sr-only"
              aria-label={t.title}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-foreground">{t.title}</span>
                {t.premium ? (
                  <span className="inline-flex rounded-full bg-foreground px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-background">
                    Premium
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-sm leading-relaxed text-foreground/65">{t.description}</p>
            </div>
          </label>
        );
      })}

      <div className="flex items-center justify-between gap-4 pt-2 text-sm">
        <span aria-live="polite" className="text-foreground/60">
          {pending ? (
            <span className="inline-flex items-center gap-2"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Enregistrement…</span>
          ) : error ? (
            <span className="text-red-700">{error}</span>
          ) : savedAt ? (
            <span className="inline-flex items-center gap-1 text-green-700"><Check className="h-3.5 w-3.5" /> Préférences enregistrées</span>
          ) : null}
        </span>
        {noneActive ? (
          <span className="text-xs text-amber-700">
            Aucune communication active. Réactivez au moins une option ci-dessus.
          </span>
        ) : null}
      </div>
    </div>
  );
}

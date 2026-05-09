'use client';

import { useState, useTransition, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Save, Eye, Send, Trash2, Plus, Minus, Calendar, Mail } from 'lucide-react';
import { MiniRichTextEditor } from '@/components/admin/MiniRichTextEditor';
import { AssetUploader } from '@/components/admin/AssetUploader';
import { ArticlePicker } from '@/components/admin/ArticlePicker';
import type { NewsletterIssueRow, NewsletterAudience, NewsletterStatus } from '@/lib/newsletter/issues';
import type { NewsletterIssue } from '@/emails/types';

interface EditorClientProps {
  issue: NewsletterIssueRow;
}

export function EditorClient({ issue: initialIssue }: EditorClientProps) {
  const router = useRouter();
  const [issue, setIssue] = useState<NewsletterIssueRow>(initialIssue);
  const [content, setContent] = useState<NewsletterIssue>(initialIssue.content);
  const [pending, startTransition] = useTransition();
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [testEmail, setTestEmail] = useState('');

  // Auto-save indicator
  const [dirty, setDirty] = useState(false);
  useEffect(() => { setDirty(true); }, [content, issue.subject, issue.preheader, issue.audience, issue.scheduled_at, issue.slug]);
  useEffect(() => { setDirty(false); }, [initialIssue]);

  const patchContent = useCallback((partial: Partial<NewsletterIssue>) => {
    setContent((c) => ({ ...c, ...partial }));
  }, []);

  const save = useCallback(() => {
    setSaveMessage(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/newsletter/${issue.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject: issue.subject,
            preheader: issue.preheader,
            audience: issue.audience,
            slug: issue.slug,
            content,
            scheduled_at: issue.scheduled_at,
          }),
        });
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { error?: string };
          setSaveMessage(`Erreur : ${j.error ?? res.status}`);
          return;
        }
        const data = (await res.json()) as { issue: NewsletterIssueRow };
        setIssue(data.issue);
        setContent(data.issue.content);
        setDirty(false);
        setSaveMessage('Enregistré ✓');
        setTimeout(() => setSaveMessage(null), 2000);
      } catch (err) {
        setSaveMessage(err instanceof Error ? err.message : 'Erreur réseau');
      }
    });
  }, [issue, content]);

  const sendTest = useCallback(() => {
    setSaveMessage(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/newsletter/${issue.id}/test`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: testEmail || undefined }),
        });
        const j = (await res.json().catch(() => ({}))) as { error?: string; sentTo?: string };
        if (!res.ok) {
          setSaveMessage(`Erreur test : ${j.error ?? res.status}`);
          return;
        }
        setSaveMessage(`Test envoyé à ${j.sentTo} ✓`);
        setTimeout(() => setSaveMessage(null), 4000);
      } catch (err) {
        setSaveMessage(err instanceof Error ? err.message : 'Erreur réseau');
      }
    });
  }, [issue.id, testEmail]);

  const setStatus = useCallback((newStatus: NewsletterStatus) => {
    startTransition(async () => {
      const res = await fetch(`/api/admin/newsletter/${issue.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const data = (await res.json()) as { issue: NewsletterIssueRow };
        setIssue(data.issue);
        setSaveMessage(`Statut → ${newStatus}`);
        setTimeout(() => setSaveMessage(null), 2000);
      }
    });
  }, [issue.id]);

  const deleteIssue = useCallback(() => {
    if (!confirm('Supprimer définitivement ce brouillon ?')) return;
    startTransition(async () => {
      const res = await fetch(`/api/admin/newsletter/${issue.id}`, { method: 'DELETE' });
      if (res.ok) router.push('/admin/newsletter');
    });
  }, [issue.id, router]);

  return (
    <div className="min-h-screen bg-muted pb-24">
      <header className="sticky top-0 z-20 border-b border-foreground/10 bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-6 py-3">
          <Link href="/admin/newsletter" className="text-xs text-foreground/55 hover:text-foreground">← Retour</Link>
          <span className="text-xs font-bold uppercase tracking-wider text-gold">N°{String(issue.number).padStart(2, '0')}</span>
          <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-xs font-semibold uppercase">{issue.status}</span>
          <span className="ml-auto" />
          {saveMessage ? <span className="text-xs text-foreground/70">{saveMessage}</span> : null}
          {dirty ? <span className="text-xs italic text-amber-700">Modifications non enregistrées</span> : null}
          <button type="button" onClick={() => setPreviewOpen(true)} className="inline-flex items-center gap-1 rounded-md border border-foreground/15 bg-white px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted">
            <Eye className="h-3.5 w-3.5" /> Aperçu
          </button>
          <button type="button" onClick={save} disabled={pending} className="inline-flex items-center gap-1 rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
            <Save className="h-3.5 w-3.5" /> {pending ? '…' : 'Enregistrer'}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-6 py-8">
        {/* META */}
        <FormSection title="Métadonnées">
          <Field label="Sujet de l'email">
            <input
              type="text"
              value={issue.subject}
              onChange={(e) => setIssue((s) => ({ ...s, subject: e.target.value }))}
              maxLength={200}
              className="w-full rounded-md border border-foreground/15 bg-white px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Pré-en-tête (preview gris dans la boîte de réception)">
            <input
              type="text"
              value={issue.preheader ?? ''}
              onChange={(e) => setIssue((s) => ({ ...s, preheader: e.target.value }))}
              maxLength={200}
              className="w-full rounded-md border border-foreground/15 bg-white px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Accroche éditoriale (cover, ~80 chars)" hint="Affichée dans la cover sous le wordmark NFI REPORT">
            <input
              type="text"
              value={content.coverHeadline ?? ''}
              onChange={(e) => patchContent({ coverHeadline: e.target.value })}
              maxLength={120}
              placeholder="Cette semaine : l'or pulvérise son record, la BRVM se réveille."
              className="w-full rounded-md border border-foreground/15 bg-white px-3 py-2 text-sm"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Type d'édition">
              <select
                value={content.editionType ?? 'standard'}
                onChange={(e) => patchContent({ editionType: e.target.value as 'standard' | 'special' | 'flash' })}
                className="w-full rounded-md border border-foreground/15 bg-white px-3 py-2 text-sm"
              >
                <option value="standard">Standard (briefing du lundi)</option>
                <option value="special">Édition spéciale</option>
                <option value="flash">Flash exclusif</option>
              </select>
            </Field>
            <Field label="Audience">
              <select
                value={issue.audience}
                onChange={(e) => setIssue((s) => ({ ...s, audience: e.target.value as NewsletterAudience }))}
                className="w-full rounded-md border border-foreground/15 bg-white px-3 py-2 text-sm"
              >
                <option value="premium">Premium uniquement</option>
                <option value="free">Lecteurs gratuits</option>
                <option value="all">Tous les abonnés</option>
              </select>
            </Field>
            <Field label="Slug (URL archive)">
              <input
                type="text"
                value={issue.slug}
                onChange={(e) => setIssue((s) => ({ ...s, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-') }))}
                className="w-full rounded-md border border-foreground/15 bg-white px-3 py-2 text-sm font-mono"
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date affichée dans l'éd." hint="Auto-rempli au lundi prochain à la création">
              <input
                type="text"
                value={content.issueDateLabel}
                onChange={(e) => patchContent({ issueDateLabel: e.target.value })}
                className="w-full rounded-md border border-foreground/15 bg-white px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Prochain numéro (footer)">
              <input
                type="text"
                value={content.nextIssueLabel ?? ''}
                onChange={(e) => patchContent({ nextIssueLabel: e.target.value })}
                placeholder="Lundi 18 mai · 7h GMT"
                className="w-full rounded-md border border-foreground/15 bg-white px-3 py-2 text-sm"
              />
            </Field>
          </div>
          <Field label="Temps de lecture (min)">
            <input
              type="number"
              min={1}
              max={60}
              value={content.readTimeMinutes ?? 7}
              onChange={(e) => patchContent({ readTimeMinutes: Number(e.target.value) })}
              className="w-32 rounded-md border border-foreground/15 bg-white px-3 py-2 text-sm"
            />
          </Field>
        </FormSection>

        {/* EDITO NOTE */}
        <FormSection title="Mot du rédacteur (optionnel)">
          <p className="text-xs text-foreground/55">{"Ouverture chaleureuse de la newsletter. S'affiche entre la cover et la citation."}</p>
          <Field label="Eyebrow (petit titre or)">
            <input
              type="text"
              value={content.editoNote?.eyebrow ?? ''}
              onChange={(e) => patchContent({ editoNote: { ...(content.editoNote ?? { body: '' }), eyebrow: e.target.value } })}
              placeholder="Bonjour"
              className="w-full rounded-md border border-foreground/15 bg-white px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Texte du mot" hint="Gras, italique, lien autorisés">
            <MiniRichTextEditor
              value={content.editoNote?.body ?? ''}
              onChange={(html) => patchContent({ editoNote: { ...(content.editoNote ?? { body: '' }), body: html } })}
              placeholder="Bienvenue dans cette édition…"
              rows={6}
            />
          </Field>
          <Field label="Signature (en italique or sous le mot)">
            <input
              type="text"
              value={content.editoNote?.signature ?? ''}
              onChange={(e) => patchContent({ editoNote: { ...(content.editoNote ?? { body: '' }), signature: e.target.value } })}
              placeholder="La rédaction NFI Report"
              className="w-full rounded-md border border-foreground/15 bg-white px-3 py-2 text-sm"
            />
          </Field>
        </FormSection>

        {/* INTRO */}
        <FormSection title="Introduction">
          <Field label="Eyebrow (petit titre or au-dessus)">
            <input
              type="text"
              value={content.intro.eyebrow ?? ''}
              onChange={(e) => patchContent({ intro: { ...content.intro, eyebrow: e.target.value } })}
              className="w-full rounded-md border border-foreground/15 bg-white px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Titre principal">
            <input
              type="text"
              value={content.intro.heading}
              onChange={(e) => patchContent({ intro: { ...content.intro, heading: e.target.value } })}
              className="w-full rounded-md border border-foreground/15 bg-white px-3 py-2 text-base font-semibold"
            />
          </Field>
          <Field label="Paragraphe d'intro (avec lettrine or auto)" hint="Gras, italique, lien autorisés">
            <MiniRichTextEditor
              value={content.intro.paragraph}
              onChange={(html) => patchContent({ intro: { ...content.intro, paragraph: html } })}
              placeholder="Pendant que le cours de l'or atteint un nouveau record…"
            />
          </Field>
          <RepeatableSection
            label="Au sommaire"
            items={content.intro.summary ?? []}
            onAdd={() => patchContent({
              intro: { ...content.intro, summary: [...(content.intro.summary ?? []), { number: String((content.intro.summary?.length ?? 0) + 1).padStart(2, '0'), label: '' }] },
            })}
            onRemove={(idx) => patchContent({
              intro: { ...content.intro, summary: (content.intro.summary ?? []).filter((_, i) => i !== idx) },
            })}
            renderItem={(item, idx) => (
              <div className="grid grid-cols-[80px_1fr] gap-2">
                <input
                  type="text"
                  value={item.number}
                  onChange={(e) => patchContent({
                    intro: {
                      ...content.intro,
                      summary: (content.intro.summary ?? []).map((it, i) => i === idx ? { ...it, number: e.target.value } : it),
                    },
                  })}
                  className="rounded border border-foreground/15 bg-white px-2 py-1 text-sm font-mono"
                />
                <input
                  type="text"
                  value={item.label}
                  onChange={(e) => patchContent({
                    intro: {
                      ...content.intro,
                      summary: (content.intro.summary ?? []).map((it, i) => i === idx ? { ...it, label: e.target.value } : it),
                    },
                  })}
                  className="rounded border border-foreground/15 bg-white px-2 py-1 text-sm"
                />
              </div>
            )}
          />
        </FormSection>

        {/* MARKET */}
        <FormSection title="Tableau de bord marchés">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gold/40 bg-gold/5 p-3">
            <input
              type="checkbox"
              checked={!!content.market.autoSync}
              onChange={(e) => patchContent({ market: { ...content.market, autoSync: e.target.checked } })}
              className="mt-1 h-4 w-4 accent-foreground"
            />
            <div className="flex-1 text-sm">
              <span className="font-semibold text-foreground">Synchroniser automatiquement avec les vraies données du site</span>
              <p className="mt-0.5 text-xs text-foreground/60">{"Si activé, le tableau ci-dessous est ignoré : la newsletter prend les valeurs vivantes depuis la table market_data du dashboard admin (BRVM, EUR/XOF, USD/XOF, Or, Brent, Uranium). Recommandé."}</p>
            </div>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Titre du tableau">
              <input
                type="text"
                value={content.market.title ?? ''}
                onChange={(e) => patchContent({ market: { ...content.market, title: e.target.value } })}
                className="w-full rounded-md border border-foreground/15 bg-white px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Source (BCEAO, BRVM, …) — ignoré si autoSync">
              <input
                type="text"
                value={content.market.source ?? ''}
                onChange={(e) => patchContent({ market: { ...content.market, source: e.target.value } })}
                className="w-full rounded-md border border-foreground/15 bg-white px-3 py-2 text-sm"
                disabled={content.market.autoSync}
              />
            </Field>
          </div>
          <Field label="Légende">
            <input
              type="text"
              value={content.market.caption ?? ''}
              onChange={(e) => patchContent({ market: { ...content.market, caption: e.target.value } })}
              className="w-full rounded-md border border-foreground/15 bg-white px-3 py-2 text-sm"
            />
          </Field>
          <RepeatableSection
            label="Lignes du tableau"
            items={content.market.rows}
            onAdd={() => patchContent({ market: { ...content.market, rows: [...content.market.rows, { label: '', value: '', changePercent: 0 }] } })}
            onRemove={(idx) => patchContent({ market: { ...content.market, rows: content.market.rows.filter((_, i) => i !== idx) } })}
            renderItem={(row, idx) => (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <input
                  placeholder="Nom (ex: BRVM Composite)"
                  value={row.label}
                  onChange={(e) => patchContent({ market: { ...content.market, rows: content.market.rows.map((r, i) => i === idx ? { ...r, label: e.target.value } : r) } })}
                  className="rounded border border-foreground/15 bg-white px-2 py-1 text-sm"
                />
                <input
                  placeholder="Valeur"
                  value={row.value}
                  onChange={(e) => patchContent({ market: { ...content.market, rows: content.market.rows.map((r, i) => i === idx ? { ...r, value: e.target.value } : r) } })}
                  className="rounded border border-foreground/15 bg-white px-2 py-1 text-sm font-mono"
                />
                <input
                  placeholder="Unité (pts, USD, %)"
                  value={row.unit ?? ''}
                  onChange={(e) => patchContent({ market: { ...content.market, rows: content.market.rows.map((r, i) => i === idx ? { ...r, unit: e.target.value } : r) } })}
                  className="rounded border border-foreground/15 bg-white px-2 py-1 text-sm"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Variation %"
                  value={row.changePercent}
                  onChange={(e) => patchContent({ market: { ...content.market, rows: content.market.rows.map((r, i) => i === idx ? { ...r, changePercent: Number(e.target.value) } : r) } })}
                  className="rounded border border-foreground/15 bg-white px-2 py-1 text-sm font-mono"
                />
              </div>
            )}
          />
        </FormSection>

        {/* NIGER KPI */}
        <FormSection title="Niger en chiffres (bloc KPI noir, optionnel)">
          <p className="text-xs text-foreground/55">Trois indicateurs clés (croissance, inflation, dette) pour cadrer toute analyse Niger.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Eyebrow (petit titre or)">
              <input
                type="text"
                value={content.nigerKpi?.eyebrow ?? ''}
                onChange={(e) => patchContent({ nigerKpi: { ...(content.nigerKpi ?? { items: [] }), eyebrow: e.target.value } })}
                placeholder="Niger en chiffres"
                className="w-full rounded-md border border-foreground/15 bg-white px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Titre">
              <input
                type="text"
                value={content.nigerKpi?.title ?? ''}
                onChange={(e) => patchContent({ nigerKpi: { ...(content.nigerKpi ?? { items: [] }), title: e.target.value } })}
                placeholder="L'économie nigérienne, en un coup d'œil"
                className="w-full rounded-md border border-foreground/15 bg-white px-3 py-2 text-sm"
              />
            </Field>
          </div>
          <Field label="Légende">
            <input
              type="text"
              value={content.nigerKpi?.caption ?? ''}
              onChange={(e) => patchContent({ nigerKpi: { ...(content.nigerKpi ?? { items: [] }), caption: e.target.value } })}
              className="w-full rounded-md border border-foreground/15 bg-white px-3 py-2 text-sm"
            />
          </Field>
          <RepeatableSection
            label="Indicateurs (3 idéalement)"
            items={content.nigerKpi?.items ?? []}
            onAdd={() => patchContent({ nigerKpi: { ...(content.nigerKpi ?? { items: [] }), items: [...(content.nigerKpi?.items ?? []), { label: '', value: '' }] } })}
            onRemove={(idx) => patchContent({ nigerKpi: { ...(content.nigerKpi ?? { items: [] }), items: (content.nigerKpi?.items ?? []).filter((_, i) => i !== idx) } })}
            renderItem={(it, idx) => (
              <div className="space-y-2">
                <input
                  placeholder="Label (ex: Croissance PIB 2026)"
                  value={it.label}
                  onChange={(e) => patchContent({ nigerKpi: { ...(content.nigerKpi ?? { items: [] }), items: (content.nigerKpi?.items ?? []).map((x, i) => i === idx ? { ...x, label: e.target.value } : x) } })}
                  className="w-full rounded border border-foreground/15 bg-white px-2 py-1 text-sm font-semibold"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    placeholder="Valeur (ex: +6,2)"
                    value={it.value}
                    onChange={(e) => patchContent({ nigerKpi: { ...(content.nigerKpi ?? { items: [] }), items: (content.nigerKpi?.items ?? []).map((x, i) => i === idx ? { ...x, value: e.target.value } : x) } })}
                    className="rounded border border-foreground/15 bg-white px-2 py-1 text-sm font-mono"
                  />
                  <input
                    placeholder="Unité (%, FCFA, $)"
                    value={it.unit ?? ''}
                    onChange={(e) => patchContent({ nigerKpi: { ...(content.nigerKpi ?? { items: [] }), items: (content.nigerKpi?.items ?? []).map((x, i) => i === idx ? { ...x, unit: e.target.value } : x) } })}
                    className="rounded border border-foreground/15 bg-white px-2 py-1 text-sm"
                  />
                </div>
                <input
                  placeholder="Précision / delta (ex: projection FMI · article IV)"
                  value={it.delta ?? ''}
                  onChange={(e) => patchContent({ nigerKpi: { ...(content.nigerKpi ?? { items: [] }), items: (content.nigerKpi?.items ?? []).map((x, i) => i === idx ? { ...x, delta: e.target.value } : x) } })}
                  className="w-full rounded border border-foreground/15 bg-white px-2 py-1 text-sm"
                />
                <input
                  placeholder="Source (ex: FMI, avril 2026)"
                  value={it.source ?? ''}
                  onChange={(e) => patchContent({ nigerKpi: { ...(content.nigerKpi ?? { items: [] }), items: (content.nigerKpi?.items ?? []).map((x, i) => i === idx ? { ...x, source: e.target.value } : x) } })}
                  className="w-full rounded border border-foreground/15 bg-white px-2 py-1 text-sm italic text-foreground/70"
                />
              </div>
            )}
          />
        </FormSection>

        {/* HEADLINES */}
        <FormSection title="Analyses (cartes principales)">
          <p className="text-xs text-foreground/55">Idéalement 1 à 3 analyses, structurées en 3 angles : ce qui se passe, ce que ça veut dire, pourquoi ça compte.</p>
          <RepeatableSection
            label="Analyses"
            items={content.headlines}
            onAdd={() => patchContent({ headlines: [...content.headlines, { title: '', whatHappening: '', whatItMeans: '', whyCare: '' }] })}
            onRemove={(idx) => patchContent({ headlines: content.headlines.filter((_, i) => i !== idx) })}
            renderItem={(h, idx) => (
              <div className="space-y-3">
                <div className="grid gap-2 sm:grid-cols-3">
                  <input placeholder="Eyebrow (ex: Analyse · Industrie)" value={h.eyebrow ?? ''} onChange={(e) => patchContent({ headlines: content.headlines.map((x, i) => i === idx ? { ...x, eyebrow: e.target.value } : x) })} className="rounded border border-foreground/15 bg-white px-2 py-1 text-sm" />
                  <input placeholder="Emoji (🪙 📈 🌾)" value={h.emoji ?? ''} onChange={(e) => patchContent({ headlines: content.headlines.map((x, i) => i === idx ? { ...x, emoji: e.target.value } : x) })} className="rounded border border-foreground/15 bg-white px-2 py-1 text-sm" />
                  <input placeholder="Numéro section (III, IV)" value={h.sectionNumeral ?? ''} onChange={(e) => patchContent({ headlines: content.headlines.map((x, i) => i === idx ? { ...x, sectionNumeral: e.target.value } : x) })} className="rounded border border-foreground/15 bg-white px-2 py-1 text-sm font-mono" />
                </div>
                <input placeholder="Titre de l'analyse" value={h.title} onChange={(e) => patchContent({ headlines: content.headlines.map((x, i) => i === idx ? { ...x, title: e.target.value } : x) })} className="w-full rounded border border-foreground/15 bg-white px-3 py-2 text-base font-semibold" />
                <Field label="Ce qui se passe" hint="Gras/italique/lien">
                  <MiniRichTextEditor value={h.whatHappening} onChange={(html) => patchContent({ headlines: content.headlines.map((x, i) => i === idx ? { ...x, whatHappening: html } : x) })} />
                </Field>
                <Field label="Ce que ça veut dire" hint="Gras/italique/lien">
                  <MiniRichTextEditor value={h.whatItMeans} onChange={(html) => patchContent({ headlines: content.headlines.map((x, i) => i === idx ? { ...x, whatItMeans: html } : x) })} />
                </Field>
                <Field label="Pourquoi ça compte" hint="Gras/italique/lien">
                  <MiniRichTextEditor value={h.whyCare} onChange={(html) => patchContent({ headlines: content.headlines.map((x, i) => i === idx ? { ...x, whyCare: html } : x) })} />
                </Field>
                <div className="grid gap-2 sm:grid-cols-2">
                  <input placeholder="Texte du bouton CTA" value={h.ctaLabel ?? ''} onChange={(e) => patchContent({ headlines: content.headlines.map((x, i) => i === idx ? { ...x, ctaLabel: e.target.value } : x) })} className="rounded border border-foreground/15 bg-white px-2 py-1 text-sm" />
                  <ArticlePicker
                    value={h.ctaUrl}
                    onChange={(url) => patchContent({ headlines: content.headlines.map((x, i) => i === idx ? { ...x, ctaUrl: url } : x) })}
                    placeholder="URL article du site ou recherche…"
                  />
                </div>
              </div>
            )}
          />
        </FormSection>

        {/* QUOTE */}
        <FormSection title="Citation de la semaine (optionnel)">
          <Field label="Texte de la citation">
            <textarea
              value={content.quote?.text ?? ''}
              onChange={(e) => patchContent({ quote: { ...(content.quote ?? { text: '', author: '' }), text: e.target.value } })}
              rows={3}
              className="w-full rounded-md border border-foreground/15 bg-white px-3 py-2 text-sm"
            />
          </Field>
          <div className="grid gap-2 sm:grid-cols-2">
            <Field label="Auteur">
              <input
                type="text"
                value={content.quote?.author ?? ''}
                onChange={(e) => patchContent({ quote: { ...(content.quote ?? { text: '', author: '' }), author: e.target.value } })}
                className="w-full rounded-md border border-foreground/15 bg-white px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Rôle (optionnel)">
              <input
                type="text"
                value={content.quote?.role ?? ''}
                onChange={(e) => patchContent({ quote: { ...(content.quote ?? { text: '', author: '' }), role: e.target.value } })}
                className="w-full rounded-md border border-foreground/15 bg-white px-3 py-2 text-sm"
              />
            </Field>
          </div>
          <AssetUploader
            label="Photo de l'auteur (optionnel, ronde dans la newsletter)"
            value={content.quote?.authorPhotoUrl}
            onChange={(url) => patchContent({ quote: { ...(content.quote ?? { text: '', author: '' }), authorPhotoUrl: url } })}
          />
          <AssetUploader
            label="Visuel finalisé du post du lundi (optionnel, remplace le rendu texte)"
            value={content.quote?.postImageUrl}
            onChange={(url) => patchContent({ quote: { ...(content.quote ?? { text: '', author: '' }), postImageUrl: url } })}
          />
        </FormSection>

        {/* DIGEST */}
        <FormSection title="Digest de la semaine (optionnel)">
          <Field label="Titre">
            <input
              type="text"
              value={content.digest?.title ?? ''}
              onChange={(e) => patchContent({ digest: { ...(content.digest ?? { items: [] }), title: e.target.value } })}
              className="w-full rounded-md border border-foreground/15 bg-white px-3 py-2 text-sm"
            />
          </Field>
          <RepeatableSection
            label="Items"
            items={content.digest?.items ?? []}
            onAdd={() => patchContent({ digest: { ...(content.digest ?? { items: [] }), items: [...(content.digest?.items ?? []), { title: '', body: '' }] } })}
            onRemove={(idx) => patchContent({ digest: { ...(content.digest ?? { items: [] }), items: (content.digest?.items ?? []).filter((_, i) => i !== idx) } })}
            renderItem={(it, idx) => (
              <div className="space-y-2">
                <div className="grid gap-2 sm:grid-cols-[60px_1fr]">
                  <input placeholder="🌾" value={it.emoji ?? ''} onChange={(e) => patchContent({ digest: { ...(content.digest ?? { items: [] }), items: (content.digest?.items ?? []).map((x, i) => i === idx ? { ...x, emoji: e.target.value } : x) } })} className="rounded border border-foreground/15 bg-white px-2 py-1 text-sm" />
                  <input placeholder="Titre" value={it.title} onChange={(e) => patchContent({ digest: { ...(content.digest ?? { items: [] }), items: (content.digest?.items ?? []).map((x, i) => i === idx ? { ...x, title: e.target.value } : x) } })} className="rounded border border-foreground/15 bg-white px-2 py-1 text-sm font-semibold" />
                </div>
                <MiniRichTextEditor
                  value={it.body}
                  onChange={(html) => patchContent({ digest: { ...(content.digest ?? { items: [] }), items: (content.digest?.items ?? []).map((x, i) => i === idx ? { ...x, body: html } : x) } })}
                />
              </div>
            )}
          />
        </FormSection>

        {/* RADAR */}
        <FormSection title="Sur notre radar (optionnel)">
          <Field label="Titre">
            <input
              type="text"
              value={content.radar?.title ?? ''}
              onChange={(e) => patchContent({ radar: { ...(content.radar ?? { items: [] }), title: e.target.value } })}
              className="w-full rounded-md border border-foreground/15 bg-white px-3 py-2 text-sm"
            />
          </Field>
          <RepeatableSection
            label="Items"
            items={content.radar?.items ?? []}
            onAdd={() => patchContent({ radar: { ...(content.radar ?? { items: [] }), items: [...(content.radar?.items ?? []), { title: '' }] } })}
            onRemove={(idx) => patchContent({ radar: { ...(content.radar ?? { items: [] }), items: (content.radar?.items ?? []).filter((_, i) => i !== idx) } })}
            renderItem={(it, idx) => (
              <div className="space-y-2">
                <input placeholder="Titre" value={it.title} onChange={(e) => patchContent({ radar: { ...(content.radar ?? { items: [] }), items: (content.radar?.items ?? []).map((x, i) => i === idx ? { ...x, title: e.target.value } : x) } })} className="w-full rounded border border-foreground/15 bg-white px-2 py-1 text-sm font-semibold" />
                <input placeholder="Indication courte" value={it.hint ?? ''} onChange={(e) => patchContent({ radar: { ...(content.radar ?? { items: [] }), items: (content.radar?.items ?? []).map((x, i) => i === idx ? { ...x, hint: e.target.value } : x) } })} className="w-full rounded border border-foreground/15 bg-white px-2 py-1 text-sm" />
                <ArticlePicker
                  value={it.url}
                  onChange={(url) => patchContent({ radar: { ...(content.radar ?? { items: [] }), items: (content.radar?.items ?? []).map((x, i) => i === idx ? { ...x, url } : x) } })}
                  placeholder="URL (article ou source externe)…"
                />
              </div>
            )}
          />
        </FormSection>

        {/* IMAGE D'ILLUSTRATION (chart) */}
        <FormSection title="Image / graphique d'illustration (optionnel)">
          <Field label="Titre du graphique">
            <input
              type="text"
              value={content.chart?.title ?? ''}
              onChange={(e) => patchContent({ chart: { ...(content.chart ?? { title: '', imageUrl: '', imageAlt: '' }), title: e.target.value } })}
              className="w-full rounded-md border border-foreground/15 bg-white px-3 py-2 text-sm"
            />
          </Field>
          <AssetUploader
            label="Image (PNG/JPG/SVG)"
            value={content.chart?.imageUrl}
            onChange={(url) => patchContent({ chart: { ...(content.chart ?? { title: '', imageUrl: '', imageAlt: '' }), imageUrl: url ?? '' } })}
          />
          <Field label="Légende">
            <input
              type="text"
              value={content.chart?.caption ?? ''}
              onChange={(e) => patchContent({ chart: { ...(content.chart ?? { title: '', imageUrl: '', imageAlt: '' }), caption: e.target.value } })}
              className="w-full rounded-md border border-foreground/15 bg-white px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Source (ex: LBMA, données mensuelles)">
            <input
              type="text"
              value={content.chart?.source ?? ''}
              onChange={(e) => patchContent({ chart: { ...(content.chart ?? { title: '', imageUrl: '', imageAlt: '' }), source: e.target.value } })}
              className="w-full rounded-md border border-foreground/15 bg-white px-3 py-2 text-sm"
            />
          </Field>
        </FormSection>

        {/* TOOLS PROMO */}
        <FormSection title="Outils Premium (promo, optionnel)">
          <p className="text-xs text-foreground/55">Met en avant vos simulateurs/calculateurs financiers pour fidéliser et convertir.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Eyebrow (petit titre or)">
              <input
                type="text"
                value={content.toolsPromo?.eyebrow ?? ''}
                onChange={(e) => patchContent({ toolsPromo: { ...(content.toolsPromo ?? { items: [] }), eyebrow: e.target.value } })}
                placeholder="Vos outils Premium"
                className="w-full rounded-md border border-foreground/15 bg-white px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Titre principal">
              <input
                type="text"
                value={content.toolsPromo?.title ?? ''}
                onChange={(e) => patchContent({ toolsPromo: { ...(content.toolsPromo ?? { items: [] }), title: e.target.value } })}
                placeholder="Mettez vos analyses en chiffres"
                className="w-full rounded-md border border-foreground/15 bg-white px-3 py-2 text-sm"
              />
            </Field>
          </div>
          <Field label="Description courte">
            <textarea
              value={content.toolsPromo?.caption ?? ''}
              onChange={(e) => patchContent({ toolsPromo: { ...(content.toolsPromo ?? { items: [] }), caption: e.target.value } })}
              rows={2}
              className="w-full rounded-md border border-foreground/15 bg-white px-3 py-2 text-sm"
            />
          </Field>
          <RepeatableSection
            label="Outils mis en avant"
            items={content.toolsPromo?.items ?? []}
            onAdd={() => patchContent({ toolsPromo: { ...(content.toolsPromo ?? { items: [] }), items: [...(content.toolsPromo?.items ?? []), { title: '', description: '', url: '' }] } })}
            onRemove={(idx) => patchContent({ toolsPromo: { ...(content.toolsPromo ?? { items: [] }), items: (content.toolsPromo?.items ?? []).filter((_, i) => i !== idx) } })}
            renderItem={(it, idx) => (
              <div className="space-y-2">
                <div className="grid gap-2 sm:grid-cols-[80px_1fr]">
                  <input
                    placeholder="📈"
                    value={it.emoji ?? ''}
                    onChange={(e) => patchContent({ toolsPromo: { ...(content.toolsPromo ?? { items: [] }), items: (content.toolsPromo?.items ?? []).map((x, i) => i === idx ? { ...x, emoji: e.target.value } : x) } })}
                    className="rounded border border-foreground/15 bg-white px-2 py-1 text-base"
                  />
                  <input
                    placeholder="Nom de l'outil"
                    value={it.title}
                    onChange={(e) => patchContent({ toolsPromo: { ...(content.toolsPromo ?? { items: [] }), items: (content.toolsPromo?.items ?? []).map((x, i) => i === idx ? { ...x, title: e.target.value } : x) } })}
                    className="rounded border border-foreground/15 bg-white px-2 py-1 text-sm font-semibold"
                  />
                </div>
                <input
                  placeholder="1 ligne d'accroche (ex: Mensualités, coût total, capacité d'endettement)"
                  value={it.description}
                  onChange={(e) => patchContent({ toolsPromo: { ...(content.toolsPromo ?? { items: [] }), items: (content.toolsPromo?.items ?? []).map((x, i) => i === idx ? { ...x, description: e.target.value } : x) } })}
                  className="w-full rounded border border-foreground/15 bg-white px-2 py-1 text-sm"
                />
                <ArticlePicker
                  value={it.url}
                  onChange={(url) => patchContent({ toolsPromo: { ...(content.toolsPromo ?? { items: [] }), items: (content.toolsPromo?.items ?? []).map((x, i) => i === idx ? { ...x, url: url ?? '' } : x) } })}
                  placeholder="URL de l'outil (ex: nfireport.com/outil/simulateur-emprunt)"
                />
              </div>
            )}
          />
        </FormSection>

        {/* DISCOVER (autres rubriques du site) */}
        <FormSection title="Continuer sur NFI Report (rubriques à valoriser)">
          <p className="text-xs text-foreground/55">
            Mets en avant les autres rubriques du site (éducation, entreprises BRVM, niger interactive…) pour
            que la newsletter ne soit pas qu’un éditorial mais aussi une porte d’entrée vers tout le produit.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Eyebrow (petit titre or)">
              <input
                type="text"
                value={content.discover?.eyebrow ?? ''}
                onChange={(e) => patchContent({ discover: { ...(content.discover ?? { items: [] }), eyebrow: e.target.value } })}
                placeholder="Continuer la lecture"
                className="w-full rounded-md border border-foreground/15 bg-white px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Titre principal">
              <input
                type="text"
                value={content.discover?.title ?? ''}
                onChange={(e) => patchContent({ discover: { ...(content.discover ?? { items: [] }), title: e.target.value } })}
                placeholder="Aussi cette semaine sur NFI Report"
                className="w-full rounded-md border border-foreground/15 bg-white px-3 py-2 text-sm"
              />
            </Field>
          </div>
          <Field label="Description courte (optionnelle)">
            <textarea
              value={content.discover?.caption ?? ''}
              onChange={(e) => patchContent({ discover: { ...(content.discover ?? { items: [] }), caption: e.target.value } })}
              rows={2}
              className="w-full rounded-md border border-foreground/15 bg-white px-3 py-2 text-sm"
            />
          </Field>
          <RepeatableSection
            label="Rubriques à mettre en avant (3 idéal)"
            items={content.discover?.items ?? []}
            onAdd={() => patchContent({ discover: { ...(content.discover ?? { items: [] }), items: [...(content.discover?.items ?? []), { rubric: '', title: '', description: '', url: '' }] } })}
            onRemove={(idx) => patchContent({ discover: { ...(content.discover ?? { items: [] }), items: (content.discover?.items ?? []).filter((_, i) => i !== idx) } })}
            renderItem={(it, idx) => (
              <div className="space-y-2">
                <div className="grid gap-2 sm:grid-cols-[80px_1fr_1fr]">
                  <input
                    placeholder="🎓"
                    value={it.emoji ?? ''}
                    onChange={(e) => patchContent({ discover: { ...(content.discover ?? { items: [] }), items: (content.discover?.items ?? []).map((x, i) => i === idx ? { ...x, emoji: e.target.value } : x) } })}
                    className="rounded border border-foreground/15 bg-white px-2 py-1 text-base"
                  />
                  <input
                    placeholder="Rubrique (ex: Éducation financière)"
                    value={it.rubric}
                    onChange={(e) => patchContent({ discover: { ...(content.discover ?? { items: [] }), items: (content.discover?.items ?? []).map((x, i) => i === idx ? { ...x, rubric: e.target.value } : x) } })}
                    className="rounded border border-foreground/15 bg-white px-2 py-1 text-sm uppercase tracking-wider"
                  />
                  <input
                    placeholder="CTA (ex: Commencer le parcours)"
                    value={it.ctaLabel ?? ''}
                    onChange={(e) => patchContent({ discover: { ...(content.discover ?? { items: [] }), items: (content.discover?.items ?? []).map((x, i) => i === idx ? { ...x, ctaLabel: e.target.value } : x) } })}
                    className="rounded border border-foreground/15 bg-white px-2 py-1 text-sm"
                  />
                </div>
                <input
                  placeholder="Titre accrocheur (ex: Comprendre la BRVM en 6 leçons)"
                  value={it.title}
                  onChange={(e) => patchContent({ discover: { ...(content.discover ?? { items: [] }), items: (content.discover?.items ?? []).map((x, i) => i === idx ? { ...x, title: e.target.value } : x) } })}
                  className="w-full rounded border border-foreground/15 bg-white px-2 py-1 text-sm font-semibold"
                />
                <textarea
                  placeholder="1 à 2 lignes d'accroche pour donner envie de cliquer"
                  value={it.description}
                  onChange={(e) => patchContent({ discover: { ...(content.discover ?? { items: [] }), items: (content.discover?.items ?? []).map((x, i) => i === idx ? { ...x, description: e.target.value } : x) } })}
                  rows={2}
                  className="w-full rounded border border-foreground/15 bg-white px-2 py-1 text-sm"
                />
                <ArticlePicker
                  value={it.url}
                  onChange={(url) => patchContent({ discover: { ...(content.discover ?? { items: [] }), items: (content.discover?.items ?? []).map((x, i) => i === idx ? { ...x, url: url ?? '' } : x) } })}
                  placeholder="URL de la rubrique (ex: nfireport.com/education)"
                />
              </div>
            )}
          />
        </FormSection>

      </main>

      {/* STICKY ACTION BAR */}
      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-foreground/10 bg-white shadow-lg">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-6 py-3">
          <input
            type="email"
            placeholder="email du destinataire test (vide = vous)"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="w-72 rounded-md border border-foreground/15 bg-white px-3 py-1.5 text-sm"
          />
          <button type="button" onClick={sendTest} disabled={pending} className="inline-flex items-center gap-1 rounded-md border border-foreground/15 bg-white px-3 py-1.5 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-50">
            <Mail className="h-3.5 w-3.5" /> Envoi test
          </button>
          <span className="ml-auto" />
          <input
            type="datetime-local"
            value={issue.scheduled_at ? new Date(issue.scheduled_at).toISOString().slice(0, 16) : ''}
            onChange={(e) => setIssue((s) => ({ ...s, scheduled_at: e.target.value ? new Date(e.target.value).toISOString() : null }))}
            className="rounded-md border border-foreground/15 bg-white px-3 py-1.5 text-sm"
          />
          <button type="button" onClick={() => setStatus('scheduled')} disabled={pending || !issue.scheduled_at} className="inline-flex items-center gap-1 rounded-md bg-gold px-3 py-1.5 text-sm font-semibold text-primary disabled:opacity-50">
            <Calendar className="h-3.5 w-3.5" /> Programmer
          </button>
          <button
            type="button"
            onClick={() => {
              if (!confirm("Envoyer maintenant à toute l'audience cible ? Cette action est irréversible.")) return;
              setSaveMessage(null);
              startTransition(async () => {
                try {
                  const res = await fetch(`/api/admin/newsletter/${issue.id}/send`, { method: 'POST' });
                  const j = (await res.json().catch(() => ({}))) as { error?: string; recipientsCount?: number };
                  if (!res.ok) {
                    setSaveMessage(`Erreur envoi : ${j.error ?? res.status}`);
                    return;
                  }
                  setSaveMessage(`Envoyé à ${j.recipientsCount ?? '?'} destinataires ✓`);
                  router.refresh();
                } catch (err) {
                  setSaveMessage(err instanceof Error ? err.message : 'Erreur réseau');
                }
              });
            }}
            disabled={pending || issue.status === 'sent'}
            title="Envoie à tous les abonnés actifs filtrés selon l'audience choisie."
            className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" /> {issue.status === 'sent' ? 'Déjà envoyé' : 'Envoyer maintenant'}
          </button>
          {issue.status === 'draft' ? (
            <button type="button" onClick={deleteIssue} disabled={pending} className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">
              <Trash2 className="h-3.5 w-3.5" /> Supprimer
            </button>
          ) : null}
        </div>
      </footer>

      {/* PREVIEW MODAL */}
      {previewOpen ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4" onClick={() => setPreviewOpen(false)}>
          <div className="relative h-[90vh] w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setPreviewOpen(false)} className="absolute right-2 top-2 z-10 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold shadow">Fermer</button>
            <iframe src={`/api/admin/newsletter/${issue.id}/preview`} title="Aperçu newsletter" className="h-full w-full border-0" />
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-foreground/10 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-foreground/60">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-foreground/60">
        {label}
        {hint ? <span className="ml-2 normal-case font-normal text-foreground/40">{hint}</span> : null}
      </label>
      {children}
    </div>
  );
}

interface RepeatableSectionProps<T> {
  label: string;
  items: T[];
  onAdd: () => void;
  onRemove: (idx: number) => void;
  renderItem: (item: T, idx: number) => React.ReactNode;
}

function RepeatableSection<T>({ label, items, onAdd, onRemove, renderItem }: RepeatableSectionProps<T>) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-foreground/60">{label}</span>
        <button type="button" onClick={onAdd} className="inline-flex items-center gap-1 rounded-md border border-foreground/15 bg-white px-2 py-1 text-xs font-semibold hover:bg-muted">
          <Plus className="h-3.5 w-3.5" /> Ajouter
        </button>
      </div>
      {items.length === 0 ? (
        <p className="rounded-md border border-dashed border-foreground/15 bg-muted/30 px-3 py-2 text-xs text-foreground/55">Aucun item.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={idx} className="rounded-md border border-foreground/10 bg-muted/30 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground/55">#{idx + 1}</span>
                <button type="button" onClick={() => onRemove(idx)} className="inline-flex items-center gap-1 text-xs text-red-700 hover:underline">
                  <Minus className="h-3.5 w-3.5" /> Supprimer
                </button>
              </div>
              {renderItem(item, idx)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

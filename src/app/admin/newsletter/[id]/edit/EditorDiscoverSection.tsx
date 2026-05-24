'use client';

import { ArticlePicker } from '@/components/admin/ArticlePicker';
import { FormSection, Field, RepeatableSection } from './EditorFormParts';
import type { NewsletterIssue } from '@/emails/types';

interface EditorDiscoverSectionProps {
  content: NewsletterIssue;
  patchContent: (partial: Partial<NewsletterIssue>) => void;
}

// Extrait de EditorClient.tsx pour passer sous le plafond 800 lignes (QUAL-H4).
// Section "Continuer sur NFI Report" : mise en avant des autres rubriques
// (education, entreprises BRVM, niger interactive).
export function EditorDiscoverSection({ content, patchContent }: EditorDiscoverSectionProps) {
  const discover = content.discover ?? { items: [] };
  const items = discover.items ?? [];

  return (
    <FormSection title="Continuer sur NFI Report (rubriques à valoriser)">
      <p className="text-xs text-foreground/55">
        Mets en avant les autres rubriques du site (éducation, entreprises BRVM, niger interactive…) pour
        que la newsletter ne soit pas qu&rsquo;un éditorial mais aussi une porte d&rsquo;entrée vers tout le produit.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Eyebrow (petit titre or)">
          <input
            type="text"
            value={discover.eyebrow ?? ''}
            onChange={(e) => patchContent({ discover: { ...discover, eyebrow: e.target.value } })}
            placeholder="Continuer la lecture"
            className="w-full rounded-md border border-foreground/15 bg-white px-3 py-2 text-sm"
          />
        </Field>
        <Field label="Titre principal">
          <input
            type="text"
            value={discover.title ?? ''}
            onChange={(e) => patchContent({ discover: { ...discover, title: e.target.value } })}
            placeholder="Aussi cette semaine sur NFI Report"
            className="w-full rounded-md border border-foreground/15 bg-white px-3 py-2 text-sm"
          />
        </Field>
      </div>
      <Field label="Description courte (optionnelle)">
        <textarea
          value={discover.caption ?? ''}
          onChange={(e) => patchContent({ discover: { ...discover, caption: e.target.value } })}
          rows={2}
          className="w-full rounded-md border border-foreground/15 bg-white px-3 py-2 text-sm"
        />
      </Field>
      <RepeatableSection
        label="Rubriques à mettre en avant (3 idéal)"
        items={items}
        onAdd={() => patchContent({ discover: { ...discover, items: [...items, { rubric: '', title: '', description: '', url: '' }] } })}
        onRemove={(idx) => patchContent({ discover: { ...discover, items: items.filter((_, i) => i !== idx) } })}
        renderItem={(it, idx) => (
          <div className="space-y-2">
            <div className="grid gap-2 sm:grid-cols-[80px_1fr_1fr]">
              <input
                placeholder="🎓"
                value={it.emoji ?? ''}
                onChange={(e) => patchContent({ discover: { ...discover, items: items.map((x, i) => i === idx ? { ...x, emoji: e.target.value } : x) } })}
                className="rounded border border-foreground/15 bg-white px-2 py-1 text-base"
              />
              <input
                placeholder="Rubrique (ex: Éducation financière)"
                value={it.rubric}
                onChange={(e) => patchContent({ discover: { ...discover, items: items.map((x, i) => i === idx ? { ...x, rubric: e.target.value } : x) } })}
                className="rounded border border-foreground/15 bg-white px-2 py-1 text-sm uppercase tracking-wider"
              />
              <input
                placeholder="CTA (ex: Commencer le parcours)"
                value={it.ctaLabel ?? ''}
                onChange={(e) => patchContent({ discover: { ...discover, items: items.map((x, i) => i === idx ? { ...x, ctaLabel: e.target.value } : x) } })}
                className="rounded border border-foreground/15 bg-white px-2 py-1 text-sm"
              />
            </div>
            <input
              placeholder="Titre accrocheur (ex: Comprendre la BRVM en 6 leçons)"
              value={it.title}
              onChange={(e) => patchContent({ discover: { ...discover, items: items.map((x, i) => i === idx ? { ...x, title: e.target.value } : x) } })}
              className="w-full rounded border border-foreground/15 bg-white px-2 py-1 text-sm font-semibold"
            />
            <textarea
              placeholder="1 à 2 lignes d'accroche pour donner envie de cliquer"
              value={it.description}
              onChange={(e) => patchContent({ discover: { ...discover, items: items.map((x, i) => i === idx ? { ...x, description: e.target.value } : x) } })}
              rows={2}
              className="w-full rounded border border-foreground/15 bg-white px-2 py-1 text-sm"
            />
            <ArticlePicker
              value={it.url}
              onChange={(url) => patchContent({ discover: { ...discover, items: items.map((x, i) => i === idx ? { ...x, url: url ?? '' } : x) } })}
              placeholder="URL de la rubrique (ex: nfireport.com/education)"
            />
          </div>
        )}
      />
    </FormSection>
  );
}

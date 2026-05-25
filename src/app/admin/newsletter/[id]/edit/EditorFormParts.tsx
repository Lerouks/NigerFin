'use client';

import { Plus, Minus } from 'lucide-react';

// Composants form helpers partages par l'editeur newsletter.
// Extraits de EditorClient.tsx pour passer sous le plafond 800 lignes.

export function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-foreground/10 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-foreground/60">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
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

export function RepeatableSection<T>({ label, items, onAdd, onRemove, renderItem }: RepeatableSectionProps<T>) {
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

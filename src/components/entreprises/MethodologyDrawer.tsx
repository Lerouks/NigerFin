'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  METHODOLOGY_SECTIONS,
  METHODOLOGY_LAST_UPDATED,
  METHODOLOGY_SIGNATURE,
} from '@/lib/methodology';

interface MethodologyDrawerProps {
  triggerClassName?: string;
  triggerLabel?: string;
}

/**
 * Drawer expliquant la methodologie editoriale de l'atlas.
 * Trigger personnalisable (style charte ou compact). Drawer modal latéral
 * accessible (focus trap natif <dialog>, ESC + clic exterieur, aria-modal).
 * Le contenu vient de src/lib/methodology.ts (single source of truth).
 */
export function MethodologyDrawer({
  triggerClassName = 'text-[13px] font-medium text-gold underline underline-offset-4 hover:text-foreground transition-colors',
  triggerLabel = 'Methodologie',
}: MethodologyDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => {
    if (!dialogRef.current) return;
    dialogRef.current.showModal();
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    if (!dialogRef.current) return;
    dialogRef.current.close();
    setIsOpen(false);
    triggerRef.current?.focus();
  }, []);

  // Fermeture sur clic exterieur (sur le backdrop ::backdrop equivalent)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClick = (e: MouseEvent) => {
      if (e.target === dialog) close();
    };
    dialog.addEventListener('click', handleClick);
    return () => dialog.removeEventListener('click', handleClick);
  }, [close]);

  // Verrouillage scroll body quand ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={open}
        className={triggerClassName}
        aria-haspopup="dialog"
      >
        {triggerLabel}
        <svg
          aria-hidden
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className="inline ml-1"
        >
          <path
            d="M3 6h6m0 0L7 4m2 2L7 8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="methodology-title"
        className="m-0 ml-auto h-full max-h-screen w-full max-w-xl bg-background p-0 backdrop:bg-black/60 backdrop:backdrop-blur-sm animate-slide-in-right"
        onClose={() => setIsOpen(false)}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 px-6 md:px-8 pt-6 md:pt-8 pb-4 border-b border-black/8">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500 mb-2">
                Atlas entreprises
              </p>
              <h2
                id="methodology-title"
                className="text-2xl md:text-3xl font-bold tracking-tight text-foreground"
              >
                Methodologie editoriale
              </h2>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Fermer"
              className="shrink-0 h-9 w-9 rounded-full text-foreground hover:bg-muted transition-colors flex items-center justify-center"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden
              >
                <path
                  d="M3 3l10 10M13 3L3 13"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 md:px-8 py-6 md:py-8">
            {METHODOLOGY_SECTIONS.map((section) => (
              <section key={section.title} className="mb-8 last:mb-0">
                <h3 className="text-[11px] uppercase tracking-[0.18em] text-gold font-semibold mb-3">
                  {section.title}
                </h3>
                <div className="space-y-3">
                  {section.paragraphs.map((paragraph, idx) => (
                    <p
                      key={idx}
                      className="text-[15px] leading-relaxed text-foreground/85"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* Footer */}
          <div className="border-t border-black/8 px-6 md:px-8 py-5 bg-secondary/50">
            <p className="text-[13px] font-medium text-foreground">
              {METHODOLOGY_SIGNATURE}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-wider text-gray-500">
              Derniere mise a jour : {formatDateFr(METHODOLOGY_LAST_UPDATED)}
            </p>
          </div>
        </div>
      </dialog>
    </>
  );
}

function formatDateFr(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

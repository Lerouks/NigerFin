'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Info } from 'lucide-react';

export interface SourceDeCours {
  cours: string;
  source: string;
}

/**
 * Bouton « Sources » du bloc « Les cours du jour » (choix de Raouf le
 * 24/11/2026, à la place d'un paragraphe de sources sous les tuiles). Il ouvre
 * la liste des sources, cours par cours ; un second clic, un clic ailleurs ou
 * Échap la referment, comme les listes du menu. La mention de protection,
 * choisie par Raouf le 25/11/2026, ferme la liste sous un trait fin.
 */
export function SourcesDesCours({ sources, mention }: { sources: SourceDeCours[]; mention?: ReactNode }) {
  const [ouvert, setOuvert] = useState(false);
  const racine = useRef<HTMLDivElement>(null);
  const bouton = useRef<HTMLButtonElement>(null);
  const idPanneau = useId();

  useEffect(() => {
    if (!ouvert) return;
    const clicAilleurs = (e: PointerEvent) => {
      if (racine.current && !racine.current.contains(e.target as Node)) setOuvert(false);
    };
    const echap = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOuvert(false);
        bouton.current?.focus();
      }
    };
    document.addEventListener('pointerdown', clicAilleurs);
    document.addEventListener('keydown', echap);
    return () => {
      document.removeEventListener('pointerdown', clicAilleurs);
      document.removeEventListener('keydown', echap);
    };
  }, [ouvert]);

  // La liste se place sous tout l'en-tête du bloc (positionné), pas sous le
  // seul bouton : sur téléphone, elle recouvrait la date.
  return (
    <div ref={racine} className="shrink-0">
      <button
        ref={bouton}
        type="button"
        aria-expanded={ouvert}
        aria-controls={idPanneau}
        onClick={() => setOuvert((o) => !o)}
        className="-mr-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] text-gray-500 transition-colors hover:bg-black/[0.04] hover:text-[#111] aria-expanded:bg-black/[0.04] aria-expanded:text-[#111]"
      >
        Sources
        <Info className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      {ouvert ? (
        <div
          id={idPanneau}
          className="absolute right-0 top-full z-20 mt-2 w-[min(20rem,calc(100vw-3rem))] rounded-lg border border-black/10 bg-white p-4 shadow-[0_12px_32px_rgba(0,0,0,0.12)]"
        >
          <dl className="space-y-3 text-[13px] leading-snug">
            {sources.map((s) => (
              <div key={s.cours}>
                <dt className="font-semibold text-[#111]">{s.cours}</dt>
                <dd className="mt-0.5 text-gray-600">{s.source}</dd>
              </div>
            ))}
          </dl>
          {mention ? (
            <p className="mt-4 border-t border-black/10 pt-3 text-[12px] leading-snug text-gray-500">{mention}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

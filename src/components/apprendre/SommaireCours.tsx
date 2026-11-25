'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, Check, ChevronDown, Lock } from 'lucide-react';
import type { Cours } from '@/lib/apprendre/donnees';
import { typographieFr } from '@/lib/typographie-fr';
import { useProgression } from './progression';

function Liste({ cours, leconId, lues, surClic }: { cours: Cours; leconId: string; lues: Set<string>; surClic?: () => void }) {
  return (
    <ol className="space-y-0.5">
      {cours.lecons.map((l) => {
        const ici = l.id === leconId;
        const lue = lues.has(l.id);
        return (
          <li key={l.id}>
            <Link
              href={l.href}
              onClick={surClic}
              aria-current={ici ? 'page' : undefined}
              className={`grid grid-cols-[26px_minmax(0,1fr)_16px] gap-2 py-2 pl-3 pr-1 border-l-2 text-[14px] leading-[1.4] transition-colors ${
                ici ? 'border-[#111] text-[#111] font-semibold' : 'border-black/10 text-gray-600 hover:text-[#111] hover:border-black/30'
              }`}
            >
              <span className={`tabular-nums ${ici ? 'text-[#111]' : 'text-gray-400'}`}>{String(l.numero).padStart(2, '0')}</span>
              <span className="text-pretty">{typographieFr(l.titre)}</span>
              <span className="pt-[3px]" aria-hidden="true">
                {lue ? <Check className="h-3.5 w-3.5 text-[#111]" strokeWidth={2.5} /> : l.premium ? <Lock className="h-3.5 w-3.5 text-gray-400" /> : null}
              </span>
              {lue && <span className="sr-only">, lue</span>}
              {l.premium && !lue && <span className="sr-only">, Premium</span>}
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

function Segments({ cours, leconId, lues }: { cours: Cours; leconId: string; lues: Set<string> }) {
  return (
    <div className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${cours.lecons.length}, minmax(0, 1fr))` }} aria-hidden="true">
      {cours.lecons.map((l) => (
        <span key={l.id} className={`h-[3px] rounded-full ${lues.has(l.id) || l.id === leconId ? 'bg-[#111]' : 'bg-black/10'}`} />
      ))}
    </div>
  );
}

/** Sur ordinateur : le sommaire du cours, collé à gauche de la leçon. */
export function SommaireCours({ cours, leconId }: { cours: Cours; leconId: string }) {
  const { lues } = useProgression();
  const position = cours.lecons.findIndex((l) => l.id === leconId) + 1;
  return (
    <nav aria-label={`Sommaire du cours ${cours.titre}`} className="hidden lg:block sticky top-[140px] self-start">
      <Link href="/apprendre" className="inline-flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-[#111]">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Apprendre
      </Link>
      <Link href={cours.href} className="mt-4 block text-[16px] font-semibold leading-snug text-[#111] hover:underline underline-offset-4">
        {typographieFr(cours.titre)}
      </Link>
      <p className="mt-1 mb-3 text-[13px] text-gray-500">
        Leçon {position} sur {cours.lecons.length}
      </p>
      <Segments cours={cours} leconId={leconId} lues={lues} />
      <div className="mt-5">
        <Liste cours={cours} leconId={leconId} lues={lues} />
      </div>
    </nav>
  );
}

/** Sur téléphone et tablette : une barre collée sous l'en-tête, qui déplie le sommaire. */
export function BarreCours({ cours, leconId }: { cours: Cours; leconId: string }) {
  const { lues } = useProgression();
  const [ouvert, setOuvert] = useState(false);
  const idPanneau = useId();
  const bouton = useRef<HTMLButtonElement>(null);
  const position = cours.lecons.findIndex((l) => l.id === leconId) + 1;

  useEffect(() => {
    if (!ouvert) return;
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOuvert(false);
        bouton.current?.focus();
      }
    };
    window.addEventListener('keydown', surTouche);
    return () => window.removeEventListener('keydown', surTouche);
  }, [ouvert]);

  return (
    <div className="lg:hidden sticky top-[65px] z-40 border-b border-black/8 bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-[52px] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href={cours.href} className="min-w-0 truncate text-[13px] font-semibold text-[#111]">
          {typographieFr(cours.titre)}
          <span className="font-normal text-gray-500"> · {position}/{cours.lecons.length}</span>
        </Link>
        <button
          ref={bouton}
          type="button"
          onClick={() => setOuvert((o) => !o)}
          aria-expanded={ouvert}
          aria-controls={idPanneau}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-black/15 bg-white px-3.5 min-h-[36px] text-[13px] font-semibold text-[#111]"
        >
          Sommaire
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${ouvert ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>
      </div>
      <div className="h-[2px] bg-black/8" aria-hidden="true">
        <div className="h-full bg-[#111]" style={{ width: `${(position / cours.lecons.length) * 100}%` }} />
      </div>
      {ouvert && (
        <div id={idPanneau} className="max-h-[60vh] overflow-y-auto border-t border-black/8 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
            <Liste cours={cours} leconId={leconId} lues={lues} surClic={() => setOuvert(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

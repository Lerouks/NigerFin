'use client';

import Link from 'next/link';
import { ArrowLeft, Check, Lock } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Cours } from '@/lib/apprendre/donnees';
import { typographieFr } from '@/lib/typographie-fr';
import { IconeTheme } from './icones';
import { useProgression } from './progression';

function Segments({ cours, leconId, lues, classe }: { cours: Cours; leconId: string; lues: Set<string>; classe: string }) {
  const position = cours.lecons.findIndex((l) => l.id === leconId);
  return (
    <span className={`grid gap-[3px] ${classe}`} style={{ gridTemplateColumns: `repeat(${cours.lecons.length}, minmax(0, 1fr))` }} aria-hidden="true">
      {cours.lecons.map((l, i) => (
        <span key={l.id} className={`h-1 rounded-full ${lues.has(l.id) || i <= position ? 'bg-[#111]' : 'bg-black/10'}`} />
      ))}
    </span>
  );
}

/**
 * Sur téléphone et tablette : le repère collé sous l'en-tête pendant la
 * lecture : l'icône du thème, le cours, la place de la leçon, sa durée et la
 * progression, sans aucun fond noir (Raouf, 26/11/2026 : « sobre »). Un
 * toucher ramène au sommaire du cours.
 */
export function TeteLecon({ cours, leconId, minutes }: { cours: Cours; leconId: string; minutes: number }) {
  const { lues } = useProgression();
  const position = cours.lecons.findIndex((l) => l.id === leconId) + 1;
  return (
    <div className="sticky top-[var(--header-height)] z-40 border-b border-black/8 bg-background/95 backdrop-blur-md lg:hidden">
      <Link href={cours.href} className="mx-auto grid min-h-[56px] max-w-7xl grid-cols-[22px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-2 sm:px-6">
        <IconeTheme nom={cours.icone} className="h-[22px] w-[22px] text-[#111]" strokeWidth={1.6} />
        <span className="min-w-0">
          <span className="block text-[14.5px] font-semibold leading-[1.25] text-[#111]">{typographieFr(cours.titre)}</span>
          <span className="block text-[13px] text-gray-500 tabular-nums">
            Leçon {position} sur {cours.lecons.length} · {minutes}&nbsp;min
          </span>
        </span>
        <Segments cours={cours} leconId={leconId} lues={lues} classe="w-14" />
      </Link>
    </div>
  );
}

/**
 * Sur ordinateur, la marge gauche : le cours (icône et titre, sans fond noir),
 * la place de la leçon et sa progression, les leçons du cours, et entre 1 024
 * et 1 279 px le plan de la leçon (au-delà, il passe dans la marge droite).
 */
export function MargeLecon({ cours, leconId, plan }: { cours: Cours; leconId: string; plan: ReactNode }) {
  const { lues } = useProgression();
  const position = cours.lecons.findIndex((l) => l.id === leconId) + 1;
  return (
    <aside className="sticky top-[calc(var(--header-height)+32px)] hidden self-start lg:block">
      <Link href="/apprendre" className="inline-flex min-h-[32px] items-center gap-1.5 text-[13px] text-gray-500 hover:text-[#111]">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Apprendre
      </Link>
      <Link href={cours.href} className="mt-3 flex items-start gap-2.5 text-[16px] font-semibold leading-snug text-[#111] hover:underline underline-offset-4">
        <IconeTheme nom={cours.icone} className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.6} />
        <span>{typographieFr(cours.titre)}</span>
      </Link>
      <p className="mb-3 mt-1 text-[13px] text-gray-500 tabular-nums">
        Leçon {position} sur {cours.lecons.length}
      </p>
      <Segments cours={cours} leconId={leconId} lues={lues} classe="mb-4" />
      <nav aria-label={`Les leçons du cours ${cours.titre}`}>
        <ol>
          {cours.lecons.map((l) => {
            const ici = l.id === leconId;
            const lue = lues.has(l.id);
            return (
              <li key={l.id}>
                <Link
                  href={l.href}
                  aria-current={ici ? 'page' : undefined}
                  className={`grid grid-cols-[26px_minmax(0,1fr)_16px] gap-1 py-[7px] text-[14px] leading-[1.4] ${
                    ici ? 'font-semibold text-[#111]' : 'text-gray-500 hover:text-[#111]'
                  }`}
                >
                  <span className="tabular-nums">{String(l.numero).padStart(2, '0')}</span>
                  <span>{typographieFr(l.titre)}</span>
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
      </nav>
      <div className="mt-7 xl:hidden">{plan}</div>
    </aside>
  );
}

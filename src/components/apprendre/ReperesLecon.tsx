'use client';

import Link from 'next/link';
import { Check, Lock } from 'lucide-react';
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
 * lecture (maquette « Le livre ») : l'icône du thème, le cours, la place de la
 * leçon, sa durée et la progression. Un toucher ramène au sommaire du cours.
 */
export function TeteLecon({ cours, leconId, minutes }: { cours: Cours; leconId: string; minutes: number }) {
  const { lues } = useProgression();
  const position = cours.lecons.findIndex((l) => l.id === leconId) + 1;
  return (
    <div className="sticky top-[var(--header-height)] z-40 border-b border-black/8 bg-background/95 backdrop-blur-md lg:hidden">
      <Link href={cours.href} className="mx-auto grid min-h-[60px] max-w-7xl grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-2 sm:px-6">
        <span className="grid h-10 w-10 place-items-center rounded-[9px] bg-[#111] text-white" aria-hidden="true">
          <IconeTheme nom={cours.icone} className="h-5 w-5" strokeWidth={1.6} />
        </span>
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
 * Sur ordinateur, la marge gauche : la couverture du cours en petit (icône et
 * titre), la place de la leçon, les leçons du cours, et entre 1 024 et 1 279 px
 * le plan de la leçon (au-delà, il passe dans la marge droite).
 */
export function MargeLecon({ cours, leconId, plan }: { cours: Cours; leconId: string; plan: ReactNode }) {
  const { lues } = useProgression();
  const position = cours.lecons.findIndex((l) => l.id === leconId) + 1;
  return (
    <aside className="sticky top-[calc(var(--header-height)+32px)] hidden self-start lg:block">
      <Link
        href={cours.href}
        className="flex aspect-[4/5] flex-col justify-between rounded-[10px] bg-[#111] px-4 pb-4 pt-3.5 text-white transition-colors hover:bg-[#1d1d1d]"
      >
        <IconeTheme nom={cours.icone} className="h-[22px] w-[22px]" strokeWidth={1.6} />
        <span className="text-[18px] font-bold leading-[1.1] tracking-[-0.02em]">{typographieFr(cours.titre)}</span>
      </Link>
      <p className="mb-1.5 mt-[18px] text-[13px] text-gray-500 tabular-nums">
        Leçon {position} sur {cours.lecons.length}
      </p>
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

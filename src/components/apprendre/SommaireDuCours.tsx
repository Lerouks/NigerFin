'use client';

import Link from 'next/link';
import { ArrowRight, Check, Clock, Lock } from 'lucide-react';
import type { Cours } from '@/lib/apprendre/donnees';
import { suiteAVenir, titreAVenir } from '@/lib/apprendre/a-venir';
import { phrases } from '@/lib/apprendre/lecture';
import { typographieFr } from '@/lib/typographie-fr';
import { AjusteurLignes } from './AjusteurLignes';
import { IconeTheme } from './icones';
import { leconDeDepart, useProgression } from './progression';

export interface ThemeSuivant {
  titre: string;
  href: string;
  icone: string;
}

/** « 2 leçons » ; « 1 libre, 1 Premium ». */
const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? 's' : ''}`;

/** Ce que le lecteur doit savoir de sa progression, et le bouton commencer ou reprendre. */
function etatDuCours(cours: Cours, lues: Set<string>) {
  const n = cours.lecons.length;
  const luesIci = cours.lecons.filter((l) => lues.has(l.id)).length;
  const toutLu = n > 0 && luesIci === n;
  const depart = leconDeDepart(cours.lecons, lues);
  const cible = toutLu ? cours.lecons[0] : depart?.lecon;
  const verrouillee = !toutLu && !!cible?.premium;
  return { n, luesIci, toutLu, depart, cible, verrouillee };
}

/**
 * Sous le titre du cours (Raouf, 26/11/2026, page sobre) : nombre de leçons,
 * durée, accès, la progression du lecteur et le bouton pour commencer ou
 * reprendre. Une leçon Premium est annoncée avant le clic, avec la prochaine
 * leçon libre.
 */
export function ActionCours({ cours }: { cours: Cours }) {
  const { lues } = useProgression();
  const { n, luesIci, toutLu, depart, cible, verrouillee } = etatDuCours(cours, lues);
  const premium = cours.lecons.filter((l) => l.premium).length;
  const libre = verrouillee ? cours.lecons.find((l) => !lues.has(l.id) && !l.premium && l.numero > cible!.numero) : undefined;
  const libelle = toutLu
    ? 'Relire le cours'
    : verrouillee
      ? `Leçon ${cible!.numero} · Premium`
      : depart?.reprise
        ? `Reprendre\u00a0: leçon ${cible!.numero}`
        : `Commencer la leçon ${cible?.numero ?? 1}`;
  const acces = premium ? `${pluriel(n - premium, 'libre')}, ${premium}\u00a0Premium` : 'Accès libre';

  return (
    <div className="mt-6 lg:mt-7">
      <p className="flex flex-wrap text-[14px] text-gray-600 tabular-nums sm:text-[15px]">
        <span className="font-semibold text-[#111]">{pluriel(n, 'leçon')}</span>
        <span aria-hidden="true" className="mx-2 text-gray-300">·</span>
        <span>{cours.minutes}&nbsp;min de lecture</span>
        <span aria-hidden="true" className="mx-2 text-gray-300">·</span>
        <span>{acces}</span>
      </p>

      {luesIci > 0 && (
        <div className="mt-5 max-w-[420px]">
          <p className="mb-2 text-[14px] text-gray-600 tabular-nums">
            {luesIci}&nbsp;leçon{luesIci > 1 ? 's' : ''} lue{luesIci > 1 ? 's' : ''} sur {n}
          </p>
          <div className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }} aria-hidden="true">
            {cours.lecons.map((l) => (
              <span key={l.id} className={`h-1 rounded-full ${lues.has(l.id) ? 'bg-[#111]' : 'bg-black/10'}`} />
            ))}
          </div>
        </div>
      )}

      {cible && (
        <div className="mt-[18px] flex flex-wrap items-center gap-x-6 gap-y-2 lg:mt-6">
          <Link
            href={cible.href}
            className="inline-flex h-[52px] w-full items-center justify-between gap-3.5 rounded-[10px] bg-[#111] px-5 text-[16px] font-semibold text-white transition-colors hover:bg-[#2a2a2a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111] sm:w-auto sm:px-6 lg:h-[54px]"
          >
            <span className="inline-flex items-center gap-2">
              {verrouillee && <Lock className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden="true" />}
              {libelle}
            </span>
            <ArrowRight className="h-5 w-5 shrink-0" aria-hidden="true" />
          </Link>
          {libre && (
            <Link href={libre.href} className="inline-flex min-h-[44px] items-center text-[15px] text-[#111] underline underline-offset-4">
              {typographieFr(`Lire la leçon ${libre.numero}, en accès libre`)}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Le sommaire du cours : chaque leçon avec son résumé, ses parties (à partir
 * de la tablette), sa durée et son état ; puis « À venir » et le thème suivant.
 */
export function SommaireDuCours({ cours, suivant }: { cours: Cours; suivant: ThemeSuivant | null }) {
  const { lues } = useProgression();
  const { toutLu, depart } = etatDuCours(cours, lues);

  return (
    <div className="min-w-0">
      <h2 className="mt-12 border-b-2 border-[#111] pb-3.5 text-[14px] font-bold text-[#111] lg:mt-16">Au sommaire</h2>
      <AjusteurLignes>
        <ol>
          {cours.lecons.map((l) => {
            const lue = lues.has(l.id);
            const estDepart = !toutLu && depart?.lecon.id === l.id;
            return (
              <li key={l.id} className="border-b border-black/12">
                <Link href={l.href} className="group block py-[22px] sm:py-7">
                  <span className="flex justify-between gap-3 text-[13.5px] text-gray-500 tabular-nums">
                    <span>Leçon {l.numero}</span>
                    <span className="inline-flex items-center gap-1.5">
                      {l.minutes}&nbsp;min
                      {l.premium && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 font-semibold text-[#111]">
                            <Lock className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden="true" />
                            Premium
                          </span>
                        </>
                      )}
                    </span>
                  </span>
                  <h3
                    className={`mt-2.5 text-[22px] font-bold leading-[1.2] tracking-[-0.025em] decoration-2 underline-offset-[5px] group-hover:underline sm:text-[26px] lg:text-[29px] lg:leading-[1.16] ${
                      lue ? 'text-gray-600' : 'text-[#111]'
                    }`}
                  >
                    {typographieFr(l.titre)}
                  </h3>
                  {l.chapeau && (
                    <p className="mt-3 text-[15.5px] leading-[1.62] text-gray-600 sm:text-[17px] max-sm:[&_.phrase]:block">
                      {phrases(l.chapeau).map((phrase, i) => (
                        <span key={phrase} className="phrase">
                          {i > 0 ? ' ' : ''}
                          {typographieFr(phrase)}
                        </span>
                      ))}
                    </p>
                  )}
                  {l.parties.length > 0 && (
                    <p className="mt-3.5 hidden text-[14.5px] leading-[1.7] text-gray-500 sm:block">
                      <b className="mr-2 font-semibold text-[#111]">Dans cette leçon</b>
                      {l.parties.map((partie, i) => (
                        <span key={partie}>
                          {i > 0 ? ' · ' : ''}
                          <span className="whitespace-nowrap">{typographieFr(partie)}</span>
                        </span>
                      ))}
                    </p>
                  )}
                  {(lue || estDepart) && (
                    <span className={`mt-4 inline-flex items-center gap-2 text-[15px] ${lue ? 'text-gray-600' : 'font-semibold text-[#111]'}`}>
                      {lue ? (
                        <>
                          <Check className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
                          Lue
                        </>
                      ) : (
                        <>
                          {depart?.reprise ? 'Reprendre ici' : 'Commencer ici'}
                          <ArrowRight className="h-[18px] w-[18px]" aria-hidden="true" />
                        </>
                      )}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ol>
        {cours.aVenir && (
          <div className="mt-6 flex items-start gap-3">
            <Clock className="mt-[3px] h-[18px] w-[18px] shrink-0 text-gold" strokeWidth={1.8} aria-hidden="true" />
            <p className="text-[15px] leading-[1.6] text-gray-600 sm:text-[15.5px]">
              À venir&nbsp;: <strong className="font-semibold text-[#111]">{typographieFr(titreAVenir(cours.aVenir.prochaine, cours.aVenir.nombre))}</strong>
              {suiteAVenir(cours.aVenir.nombre)}
            </p>
          </div>
        )}
      </AjusteurLignes>

      {suivant && (
        <Link
          href={suivant.href}
          className="mt-14 grid grid-cols-[52px_minmax(0,1fr)] items-center gap-4 rounded-[14px] border border-black/12 bg-white p-3 transition-colors hover:border-black/30 sm:grid-cols-[64px_minmax(0,1fr)_24px] sm:gap-[18px] sm:p-3.5 sm:pr-[18px]"
        >
          <span className="grid h-[52px] w-[52px] place-items-center rounded-[10px] border border-black/12 text-[#111] sm:h-16 sm:w-16" aria-hidden="true">
            <IconeTheme nom={suivant.icone} className="h-6 w-6" />
          </span>
          <span className="min-w-0">
            <span className="block text-[13px] text-gray-500">Thème suivant</span>
            <span className="mt-0.5 block text-[19px] font-bold leading-[1.25] tracking-[-0.015em] text-[#111] sm:text-[20px]">
              {typographieFr(suivant.titre)}
            </span>
          </span>
          <ArrowRight className="hidden h-[22px] w-[22px] text-[#111] sm:block" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

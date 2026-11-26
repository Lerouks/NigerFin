'use client';

import Link from 'next/link';
import { ArrowRight, Check, Lock } from 'lucide-react';
import type { Cours } from '@/lib/apprendre/donnees';
import { suiteAVenir, titreAVenir } from '@/lib/apprendre/a-venir';
import { typographieFr } from '@/lib/typographie-fr';
import { AjusteurLignes } from './AjusteurLignes';
import { leconDeDepart, useProgression } from './progression';

/** La leçon à ouvrir : celle où reprendre, la première sinon ; et si elle est Premium. */
function etatDuCours(cours: Cours, lues: Set<string>) {
  const n = cours.lecons.length;
  const toutLu = n > 0 && cours.lecons.every((l) => lues.has(l.id));
  const depart = leconDeDepart(cours.lecons, lues);
  const cible = toutLu ? cours.lecons[0] : depart?.lecon;
  const verrouillee = !toutLu && !!cible?.premium;
  return { toutLu, depart, cible, verrouillee };
}

/**
 * Le bouton du cours, sous son titre : commencer, reprendre ou relire. Une
 * leçon Premium est annoncée avant le clic, avec la prochaine leçon libre.
 */
export function ActionCours({ cours }: { cours: Cours }) {
  const { lues } = useProgression();
  const { toutLu, depart, cible, verrouillee } = etatDuCours(cours, lues);
  if (!cible) return null;
  const libre = verrouillee ? cours.lecons.find((l) => !lues.has(l.id) && !l.premium && l.numero > cible.numero) : undefined;
  const libelle = toutLu
    ? 'Relire le cours'
    : verrouillee
      ? `Leçon ${cible.numero} · Premium`
      : depart?.reprise
        ? `Reprendre\u00a0: leçon ${cible.numero}`
        : `Commencer la leçon ${cible.numero}`;

  return (
    <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2">
      <Link
        href={cible.href}
        className="inline-flex h-[52px] w-full items-center justify-between gap-3.5 rounded-[10px] bg-[#111] px-5 text-[16px] font-semibold text-white transition-colors hover:bg-[#2a2a2a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111] sm:w-auto sm:px-6"
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
  );
}

/**
 * Les leçons du cours, une ligne chacune : numéro, titre, durée (Raouf,
 * 26/11/2026 : « trop de texte, trop d'info », il a choisi « Titres
 * seulement »). Une leçon lue est cochée, une leçon Premium a son cadenas,
 * celle où commencer est en gras. Puis la ligne « À venir ».
 */
export function SommaireDuCours({ cours }: { cours: Cours }) {
  const { lues } = useProgression();
  const { toutLu, depart } = etatDuCours(cours, lues);

  return (
    <div className="mt-12 min-w-0 sm:mt-14">
      <h2 className="sr-only">Les leçons du cours</h2>
      <AjusteurLignes>
        <ol className="border-t border-black/12">
          {cours.lecons.map((l) => {
            const lue = lues.has(l.id);
            const ici = !toutLu && depart?.lecon.id === l.id;
            return (
              <li key={l.id} className="border-b border-black/12">
                <Link
                  href={l.href}
                  className="group grid min-h-[60px] grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-3 py-3.5 sm:grid-cols-[36px_minmax(0,1fr)_auto] sm:gap-4"
                >
                  <span className={`text-[15px] tabular-nums ${ici ? 'font-semibold text-[#111]' : 'text-gray-400'}`} aria-hidden="true">
                    {lue ? <Check className="h-4 w-4 text-[#111]" strokeWidth={2.5} /> : l.numero}
                  </span>
                  <span
                    className={`text-[17px] leading-[1.35] underline-offset-4 group-hover:underline sm:text-[19px] ${
                      ici ? 'font-semibold text-[#111]' : lue ? 'text-gray-500' : 'text-[#111]'
                    }`}
                  >
                    {typographieFr(l.titre)}
                    <span className="sr-only">
                      {`, leçon ${l.numero}, ${l.minutes} min`}
                      {l.premium ? ', Premium' : ''}
                      {lue ? ', lue' : ''}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[14px] text-gray-500 tabular-nums" aria-hidden="true">
                    {l.premium && <Lock className="h-3.5 w-3.5" strokeWidth={2.2} />}
                    {l.minutes}&nbsp;min
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
        {cours.aVenir && (
          <p className="mt-5 text-[15px] leading-[1.6] text-gray-500">
            À venir&nbsp;: <span className="text-[#111]">{typographieFr(titreAVenir(cours.aVenir.prochaine, cours.aVenir.nombre))}</span>
            {suiteAVenir(cours.aVenir.nombre)}
          </p>
        )}
      </AjusteurLignes>
    </div>
  );
}

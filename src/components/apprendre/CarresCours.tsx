'use client';

import Link from 'next/link';
import { ArrowRight, Check, Lock } from 'lucide-react';
import type { Cours } from '@/lib/apprendre/donnees';
import { typographieFr } from '@/lib/typographie-fr';
import { AjusteurLignes } from './AjusteurLignes';
import { leconDeDepart, useProgression } from './progression';

/**
 * La page d'un cours en carrés noirs (choix de Raouf, 25/11/2026) : le grand
 * carré du cours, puis un carré par leçon, dans l'ordre. Le carré blanc montre où commencer, ou reprendre pour
 * un lecteur connecté ; une leçon lue jusqu'au bout est cochée.
 */
export function CarresCours({ cours, titrePrincipal = false }: { cours: Cours; titrePrincipal?: boolean }) {
  const { lues } = useProgression();
  const depart = leconDeDepart(cours.lecons, lues);
  const Titre = titrePrincipal ? 'h1' : 'h2';
  const total = cours.lecons.length;
  const toutLu = total > 0 && cours.lecons.every((l) => lues.has(l.id));

  const libelleBouton = toutLu
    ? 'Relire le cours'
    : depart?.reprise
      ? `Reprendre : leçon ${depart.lecon.numero}`
      : 'Commencer le cours';
  const cible = toutLu ? cours.lecons[0]!.href : (depart?.lecon.href ?? cours.href);
  // Un petit cours (une à trois leçons) tient sur une seule rangée : le carré du
  // cours sur deux colonnes, ses leçons à côté, à la même hauteur.
  const petit = total <= 3;
  const grille =
    total === 1
      ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-3'
      : total === 2
        ? 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4'
        : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5';
  const blocCours = petit
    ? total === 2
      ? 'col-span-2 lg:col-span-2'
      : 'col-span-2 sm:col-span-3 lg:col-span-2'
    : 'col-span-2 sm:col-span-3 lg:col-span-2 lg:row-span-2';

  return (
    <div className={`grid ${grille} gap-2.5 sm:gap-3 lg:gap-3.5`}>
      <div className={`${blocCours} flex flex-col justify-between gap-10 rounded-[14px] bg-[#111] text-white p-6 sm:p-7 lg:p-8 min-h-[260px]`}>
        <div className="flex items-start justify-between gap-4 text-[13px] text-white/55 tabular-nums">
          <span>Cours {cours.numero}</span>
          <span className="text-right">
            {total}&nbsp;leçon{total > 1 ? 's' : ''} · {cours.minutes}&nbsp;min
          </span>
        </div>
        <div>
          <Titre
            id={`cours-${cours.slug}`}
            className="text-[28px] sm:text-[32px] lg:text-[36px] font-bold leading-[1.08] tracking-[-0.025em] text-balance"
          >
            {typographieFr(cours.titre)}
          </Titre>
          {cours.description && (
            <AjusteurLignes>
              <p className="mt-3 max-w-[36ch] text-[15px] sm:text-[16px] leading-relaxed text-white/70">
                {typographieFr(cours.description)}
              </p>
            </AjusteurLignes>
          )}
          <Link
            href={cible}
            className="mt-6 inline-flex items-center gap-2.5 rounded-lg bg-white px-5 py-3 text-[15px] font-semibold text-[#111] transition-colors hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {libelleBouton}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>

      {cours.lecons.map((lecon, i) => {
        const estDepart = !toutLu && depart?.lecon.id === lecon.id;
        const lue = lues.has(lecon.id);
        const dernier = i === total - 1;
        // Une leçon seule sur la dernière rangée prend toute la largeur, jamais un carré orphelin.
        const seuleTelephone = dernier && total % 2 === 1;
        const seuleTablette = dernier && total !== 2 && total % 3 === 1;
        const etat = estDepart
          ? depart?.reprise
            ? 'Reprendre'
            : 'Commencer ici'
          : lue
            ? 'Lue'
            : lecon.nouvelle
              ? 'Nouveau'
              : null;
        const descriptionAccessible = [
          `Leçon ${lecon.numero} sur ${total}`,
          typographieFr(lecon.titre),
          `${lecon.minutes} min`,
          lecon.premium ? 'Premium' : null,
          lue ? 'lue' : null,
        ]
          .filter(Boolean)
          .join(', ');
        return (
          <Link
            key={lecon.id}
            href={lecon.href}
            aria-label={descriptionAccessible}
            className={[
              'group flex flex-col justify-between rounded-[14px] p-4 sm:p-5 max-[359px]:p-3 transition-colors',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111]',
              seuleTelephone ? 'col-span-2 min-h-[150px]' : 'aspect-square',
              seuleTablette
                ? 'sm:col-span-3 sm:aspect-auto sm:min-h-[150px]'
                : seuleTelephone
                  ? 'sm:col-span-1 sm:min-h-0 sm:aspect-square'
                  : '',
              petit
                ? 'lg:col-span-1 lg:aspect-auto lg:min-h-0'
                : seuleTelephone || seuleTablette
                  ? 'lg:col-span-1 lg:min-h-0 lg:aspect-square'
                  : '',
              estDepart
                ? 'bg-white text-[#111] border border-black/12 hover:bg-[#f4f4f5]'
                : 'bg-[#111] text-white border border-[#111] hover:bg-[#1d1d1d]',
            ].join(' ')}
          >
            <span className="flex items-start justify-between gap-2" aria-hidden="true">
              <span
                className={`text-[24px] sm:text-[28px] max-[359px]:text-[20px] font-medium leading-none tracking-[-0.02em] tabular-nums ${
                  estDepart ? 'text-black/25' : lue ? 'text-white/25' : 'text-white/35'
                }`}
              >
                {String(lecon.numero).padStart(2, '0')}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 text-[12px] leading-none whitespace-nowrap ${
                  estDepart ? 'font-semibold text-[#111]' : lue ? 'text-white' : 'text-white/60'
                }`}
              >
                {lue && !estDepart && <Check className="h-3.5 w-3.5" strokeWidth={2.5} />}
                {etat}
                {lecon.premium && !lue && <Lock className="h-3.5 w-3.5" strokeWidth={2} />}
              </span>
            </span>
            <span aria-hidden="true">
              <span
                className={`block text-[15px] sm:text-[16px] lg:text-[17px] font-semibold leading-[1.28] tracking-[-0.01em] text-balance ${
                  lue && !estDepart ? 'text-white/70' : ''
                }`}
              >
                {typographieFr(lecon.titre)}
              </span>
              <span className={`mt-2 block text-[13px] ${estDepart ? 'text-gray-500' : 'text-white/55'}`}>
                {lecon.minutes}&nbsp;min{lecon.premium ? ' · Premium' : ''}
              </span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}

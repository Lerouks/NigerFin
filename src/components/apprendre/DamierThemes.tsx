'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Banknote,
  BarChart3,
  BookOpen,
  Briefcase,
  Building2,
  Check,
  Coins,
  Globe,
  GraduationCap,
  Landmark,
  LineChart,
  PiggyBank,
  Scale,
  ShieldCheck,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import type { Theme } from '@/lib/apprendre/donnees';
import { typographieFr } from '@/lib/typographie-fr';
import { leconDeDepart, useProgression } from './progression';

/** Les icônes qu'on peut choisir pour un thème dans l'administration. */
const ICONES: Record<string, LucideIcon> = {
  BookOpen,
  TrendingUp,
  BarChart3,
  Landmark,
  Banknote,
  PiggyBank,
  LineChart,
  Wallet,
  Scale,
  ShieldCheck,
  Globe,
  Briefcase,
  Building2,
  Coins,
  GraduationCap,
};

/**
 * La page d'entrée d'Apprendre : un carré noir par thème, dans l'ordre (choix
 * de Raouf, 25/11/2026, « le damier »). Un thème ouvert mène à son cours ; un
 * thème sans leçon publiée reste à sa place, grisé, avec « En préparation ».
 * Pour un lecteur connecté, le carré montre où il en est.
 *
 * Dix thèmes tiennent sur deux rangées de cinq (ordinateur) ou cinq rangées
 * de deux (téléphone). Un thème seul sur la dernière rangée prend toute la
 * largeur, jamais un carré orphelin.
 */
export function DamierThemes({ themes }: { themes: Theme[] }) {
  const { lues } = useProgression();
  const total = themes.length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3 lg:gap-3.5">
      {themes.map((theme, i) => {
        const Icone = ICONES[theme.icone] ?? BookOpen;
        const dernier = i === total - 1;
        // Seul sur sa rangée : à 2 colonnes (téléphone), 3 (tablette) ou 5 (ordinateur).
        const seul2 = dernier && total % 2 === 1;
        const seul3 = dernier && total % 3 === 1;
        const seul5 = dernier && total % 5 === 1;
        const forme = [
          'flex flex-col justify-between rounded-[14px] p-4 sm:p-5 lg:p-[22px] max-[359px]:p-3',
          seul2 ? 'col-span-2 min-h-[150px]' : 'aspect-square',
          seul3 ? 'sm:col-span-3 sm:aspect-auto sm:min-h-[150px]' : seul2 ? 'sm:col-span-1 sm:min-h-0 sm:aspect-square' : '',
          seul5 ? 'lg:col-span-5 lg:aspect-auto lg:min-h-[180px]' : seul2 || seul3 ? 'lg:col-span-1 lg:min-h-0 lg:aspect-square' : '',
        ]
          .filter(Boolean)
          .join(' ');
        const titre = (
          <h2 className="text-[16px] lg:text-[19px] max-[359px]:text-[13.5px] font-semibold leading-[1.24] tracking-[-0.012em] text-balance">
            {typographieFr(theme.titre)}
          </h2>
        );

        if (!theme.cours) {
          return (
            <div key={theme.id} className={`${forme} bg-[#1c1c1c] text-white`}>
              <Icone className="h-[26px] w-[26px] lg:h-[30px] lg:w-[30px] max-[359px]:h-6 max-[359px]:w-6 text-white/25" strokeWidth={1.5} aria-hidden="true" />
              <div className="text-white/45">
                {titre}
                <p className="mt-1.5 text-[12.5px] lg:text-[13px] max-[359px]:text-[12px] text-white/35">En préparation</p>
              </div>
            </div>
          );
        }

        const cours = theme.cours;
        const n = cours.lecons.length;
        const luesIci = cours.lecons.filter((l) => lues.has(l.id)).length;
        const toutLu = luesIci === n;
        const depart = leconDeDepart(cours.lecons, lues);
        const nouveau = !toutLu && cours.lecons.some((l) => l.nouvelle && !lues.has(l.id));
        const action = toutLu ? 'Relire' : depart?.reprise ? 'Reprendre' : 'Commencer';
        // Avec la barre de progression, le carré garde sa forme sur téléphone : marges resserrées.
        const enCours = luesIci > 0 && !toutLu;
        const marge = enCours ? 'mt-2 sm:mt-3 lg:mt-4 max-[359px]:mt-1.5' : 'mt-3 lg:mt-4';
        const descriptionAccessible = [
          typographieFr(theme.titre),
          `${n} leçon${n > 1 ? 's' : ''}`,
          `${cours.minutes} min`,
          luesIci > 0 ? `${luesIci} lue${luesIci > 1 ? 's' : ''} sur ${n}` : null,
          nouveau ? 'nouvelle leçon' : null,
        ]
          .filter(Boolean)
          .join(', ');

        return (
          <Link
            key={theme.id}
            href={cours.href}
            aria-label={descriptionAccessible}
            className={`${forme} group bg-[#111] text-white transition-colors hover:bg-[#1d1d1d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111]`}
          >
            <span className="flex items-start justify-between gap-2" aria-hidden="true">
              <Icone className="h-[26px] w-[26px] lg:h-[30px] lg:w-[30px] max-[359px]:h-6 max-[359px]:w-6" strokeWidth={1.5} />
              {toutLu ? (
                <span className="inline-flex items-center gap-1 text-[12px] leading-none text-white/70">
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                  Terminé
                </span>
              ) : nouveau ? (
                <span className="text-[12px] font-semibold leading-none">Nouveau</span>
              ) : null}
            </span>
            <span className="block" aria-hidden="true">
              {titre}
              <span className={`${enCours ? 'mt-1.5 max-[359px]:mt-1' : 'mt-1.5'} block text-[12.5px] lg:text-[13px] max-[359px]:text-[12px] text-white/55 tabular-nums`}>
                {n}&nbsp;leçon{n > 1 ? 's' : ''} · {cours.minutes}&nbsp;min
              </span>
              {enCours && (
                <span className={`${marge} grid gap-[3px]`} style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
                  {cours.lecons.map((l) => (
                    <span key={l.id} className={`h-[3px] rounded-full ${lues.has(l.id) ? 'bg-white' : 'bg-white/16'}`} />
                  ))}
                </span>
              )}
              <span className={`${marge} flex items-center justify-between gap-2 text-[13.5px] lg:text-[14px] max-[359px]:text-[13px] font-semibold`}>
                {action}
                <ArrowRight className="h-[18px] w-[18px] shrink-0 transition-transform group-hover:translate-x-0.5" />
              </span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}

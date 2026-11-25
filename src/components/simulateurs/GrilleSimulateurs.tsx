import Link from 'next/link';
import { ArrowRight, Lock } from 'lucide-react';
import { SIMULATEURS_MENU } from '@/lib/navigation';
import { typographieFr } from '@/lib/typographie-fr';

/**
 * Les six simulateurs en carrés noirs, de la famille des cours d'Apprendre,
 * l'autre rubrique « agir » du menu (25/11/2026 : maquette B retenue parmi
 * trois, à la place des cartes « Plan gratuit » et « Plan Premium », qui
 * faisaient de la page une page de tarifs).
 *
 * Une colonne sur téléphone, deux de 768 à 1 279 px, trois dès 1 280 px : chaque
 * légende tient alors sur une ligne (mesuré mot par mot en production, de 320 à
 * 1 440 px : à deux colonnes sur téléphone, elles finissaient sur deux mots).
 *
 * La liste, l'ordre, les libellés et le statut Premium viennent du menu
 * (SIMULATEURS_MENU) : un seul endroit à tenir à jour, vérifié par un test
 * contre les pages des simulateurs.
 */
export function GrilleSimulateurs() {
  return (
    <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-3 lg:gap-3.5">
      {SIMULATEURS_MENU.map((s) => {
        const detail = typographieFr(s.detail ?? '');
        return (
          <li key={s.href} className="flex">
            <Link
              href={s.href}
              aria-label={`${s.label}, ${s.premium ? 'Premium' : 'gratuit'}. ${detail}`}
              className="group flex w-full min-h-[120px] flex-col justify-between gap-4 rounded-[14px] border border-[#111] bg-[#111] p-4 text-white transition-colors hover:bg-[#1d1d1d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111] md:min-h-[200px] md:gap-8 md:p-6 xl:min-h-[228px] xl:p-7"
            >
              <span className="flex items-center justify-between gap-3 text-[12px] leading-none" aria-hidden="true">
                <span className={`inline-flex items-center gap-1.5 ${s.premium ? 'text-white/75' : 'text-white/55'}`}>
                  {s.premium ? <Lock className="h-3.5 w-3.5" strokeWidth={2} /> : null}
                  {s.premium ? 'Premium' : 'Gratuit'}
                </span>
                <ArrowRight className="h-[18px] w-[18px] text-white/40 transition-transform group-hover:translate-x-0.5 group-hover:text-white" />
              </span>
              <span aria-hidden="true">
                <span className="block text-[18px] font-semibold leading-[1.18] tracking-[-0.015em] md:text-[24px] xl:text-[28px]">
                  {s.label}
                </span>
                <span className="mt-1.5 block text-[13px] leading-snug text-white/60 text-balance md:mt-2 md:text-[15px]">
                  {detail}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

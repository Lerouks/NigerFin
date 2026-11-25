'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { SIMULATEURS_MENU } from '@/lib/navigation';
import { typographieFr } from '@/lib/typographie-fr';

const NOMBRES = ['', 'Un', 'Deux', 'Trois', 'Quatre', 'Cinq', 'Six'];

/** « Trois simulateurs sont réservés aux abonnés Premium. », calculé depuis le menu. */
export function phraseSimulateursPremium(nombre: number): string {
  if (nombre <= 0) return '';
  const mot = NOMBRES[nombre] ?? String(nombre);
  return nombre === 1
    ? `${mot} simulateur est réservé aux abonnés Premium.`
    : `${mot} simulateurs sont réservés aux abonnés Premium.`;
}

/**
 * Sous la grille, pour un lecteur sans abonnement : combien de simulateurs sont
 * réservés, puis le lien vers l'offre. Rendue d'emblée (la plupart des lecteurs
 * ne sont pas abonnés), puis retirée pour un abonné Premium ou un admin.
 *
 * La phrase et le lien sont deux éléments : sur ordinateur ils tiennent sur une
 * ligne, sur téléphone le lien passe dessous en entier. La phrase est équilibrée
 * (text-balance) pour ne jamais finir sur deux ou trois mots seuls.
 */
export function OffrePremiumSimulateurs({ className = '' }: { className?: string }) {
  const { isLoading, userRole } = useAuth();
  const abonne = userRole === 'premium' || userRole === 'admin';
  const nombre = SIMULATEURS_MENU.filter((s) => s.premium).length;
  if ((!isLoading && abonne) || nombre === 0) return null;

  return (
    <div className={`flex flex-wrap items-baseline gap-x-3 gap-y-1.5 text-[14px] leading-relaxed ${className}`}>
      <p className="text-gray-600 text-balance">{typographieFr(phraseSimulateursPremium(nombre))}</p>
      <Link
        href="/pricing"
        className="whitespace-nowrap font-semibold text-[#111] underline-offset-4 hover:underline"
      >
        Voir l&rsquo;offre&nbsp;Premium&nbsp;›
      </Link>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { VariationBadge } from '@/components/data/VariationBadge';
import { MentionCours } from '@/components/finance/MentionCours';
import { useCoursDuJour } from '@/hooks/useCoursDuJour';

const nombre = (valeur: number, decimales: number) =>
  new Intl.NumberFormat('fr-FR', { minimumFractionDigits: decimales, maximumFractionDigits: decimales }).format(valeur);

const dateLongue = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });

/**
 * Encadré des cours de l'accueil et des articles (refait le 25/11/2026).
 *
 * Il lisait l'ancienne table market_data, un second circuit : l'or en dollars
 * l'once quand la page Finance le donnait en FCFA le gramme, le Brent d'un autre
 * contrat, le dollar signé BCEAO alors qu'il venait de la BCE. Il montre
 * désormais exactement les cours du jour de la page Finance, mêmes sources,
 * mêmes chiffres, avec la mention de protection et le lien vers la page
 * Marchés, qui détaille les sources.
 *
 * Sa largeur décide de sa forme : une colonne dans la marge d'un article, deux
 * puis quatre sur la pleine largeur de l'accueil.
 */
export function MarketDataWidget() {
  const { cours, isLoading } = useCoursDuJour();

  // Comme sur la page Finance : rien plutôt qu'un cadre vide ou l'euro seul.
  if (!isLoading && cours.length < 2) return null;

  const plusRecente = cours
    .map((c) => c.date)
    .filter((d): d is string => Boolean(d))
    .sort()
    .at(-1);

  return (
    <div className="@container overflow-hidden rounded-xl border border-black/6 bg-white">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 border-b border-black/5 px-5 py-4">
        <h3 className="text-[15px] font-semibold">Les cours du jour</h3>
        {plusRecente ? <p className="text-[12px] text-gray-500">{dateLongue(plusRecente)}</p> : null}
      </div>

      {isLoading && cours.length === 0 ? (
        <div className="space-y-3 p-5" aria-hidden="true">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between py-1.5">
              <div className="h-3 w-24 animate-pulse rounded-sm bg-gray-100" />
              <div className="h-3 w-16 animate-pulse rounded-sm bg-gray-100" />
            </div>
          ))}
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-x-8 px-5 pb-1 pt-1 @xl:grid-cols-2 @4xl:grid-cols-4">
          {cours.map((c) => (
            <li key={c.cle} className="flex items-center justify-between gap-3 border-b border-black/6 py-2.5">
              <span className="min-w-0 text-[13px] font-medium">{c.libelle}</span>
              <span className="shrink-0 text-right">
                <span className="block whitespace-nowrap text-[13px] font-medium tabular-nums">
                  {nombre(c.valeur, c.decimales)}
                  <span className="ml-1 text-[12px] font-normal text-gray-500">{c.unite}</span>
                </span>
                {c.mention ? (
                  <span className="block text-[12px] text-gray-500">{c.mention}</span>
                ) : (
                  <span className="flex justify-end">
                    <VariationBadge value={c.variation} pill />
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="border-t border-black/5 bg-background px-5 py-3.5 text-[12px] leading-snug text-gray-500">
        <p>
          <MentionCours />
        </p>
        <p className="mt-2">
          <Link href="/marches" className="font-semibold text-[#111] underline-offset-4 hover:underline">
            Tous les cours et leurs sources
          </Link>
        </p>
      </div>
    </div>
  );
}

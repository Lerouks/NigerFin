import type { ReactNode } from 'react';

/**
 * COMPOSANT DE CHIFFRE UNIQUE DU SITE.
 *
 * Deux principes, imposes par le type de props, donc impossibles a contourner.
 *
 * 1. Chaque chiffre porte SA SOURCE et SA DATE. `source` est obligatoire. La
 *    provenance s'affiche en monospace, format fixe « SOURCE · MM/AAAA », juste
 *    sous la valeur. C'est le garde-fou de la Phase 0 (aucun chiffre invente)
 *    rendu visible : un lecteur voit d'ou vient le nombre et de quand il date.
 *    Avant, la typographie de chiffre etait reimplementee sept fois, a sept
 *    echelles differentes, et quatre de ces sept endroits n'affichaient aucune
 *    provenance. Ici, le TypeScript refuse un chiffre sans source.
 *
 * 2. Une valeur ABSENTE s'affiche comme absente. `value: number | null` : quand
 *    elle est nulle, on rend « donnee indisponible », jamais un zero, jamais un
 *    tiret ambigu, jamais une valeur perimee. On garde la source et la date pour
 *    que le lecteur comprenne pourquoi la donnee manque.
 *
 * Server component pur : aucun JS cote client.
 */

export interface FigureProps {
  /** Valeur a afficher. `null` = donnee indisponible (aucune source fiable). */
  value: number | null;
  /**
   * Provenance de la donnee, OBLIGATOIRE. Ex. « BCEAO », « Yahoo Finance »,
   * « INS », « TOFE ». Jamais invente : si la source est inconnue, la donnee
   * n'a pas sa place ici.
   */
  source: string;
  /** Date ou periode de la donnee, format libre court. Ex. « 04/2026 », « 20/07 ». */
  asOf?: string;
  /** Unite affichee apres la valeur. Ex. « FCFA », « USD/baril », « PTS ». */
  unit?: string;
  /** Options de formatage du nombre (separateur de milliers FR par defaut). */
  decimals?: number;
  /** Taille visuelle de la valeur. */
  size?: 'sm' | 'md' | 'lg';
  /** Badge de variation optionnel (ex. <VariationBadge/>), rendu a droite. */
  variation?: ReactNode;
  className?: string;
}

const VALUE_SIZE: Record<NonNullable<FigureProps['size']>, string> = {
  sm: 'text-[15px]',
  md: 'text-[22px]',
  lg: 'text-3xl md:text-[32px]',
};

/** Formate un nombre en francais : espace fine insecable comme separateur de milliers. */
function formatFr(value: number, decimals?: number): string {
  return value.toLocaleString('fr-FR', {
    minimumFractionDigits: decimals ?? (Number.isInteger(value) ? 0 : 2),
    maximumFractionDigits: decimals ?? (value < 10 && !Number.isInteger(value) ? 4 : 2),
  });
}

export function Figure({
  value,
  source,
  asOf,
  unit,
  decimals,
  size = 'md',
  variation,
  className = '',
}: FigureProps) {
  // Ligne de provenance, en monospace pour un alignement de terminal.
  // Format fixe : « SOURCE · MM/AAAA » (le point median separe, jamais un tiret).
  const meta = [source, asOf].filter(Boolean).join(' · ');
  const indisponible = value === null || !Number.isFinite(value);

  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-3">
        {indisponible ? (
          <span className={`${VALUE_SIZE[size]} font-medium text-gray-400 leading-none`}>
            Donnée indisponible
          </span>
        ) : (
          <span className="flex items-baseline gap-1 min-w-0">
            <span className={`${VALUE_SIZE[size]} font-bold text-[#111] tabular-nums leading-none`}>
              {formatFr(value as number, decimals)}
            </span>
            {unit && <span className="text-[12px] text-gray-500 font-medium shrink-0">{unit}</span>}
          </span>
        )}
        {variation && <span className="shrink-0">{variation}</span>}
      </div>
      {meta && (
        <div className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.04em] text-gray-400 tabular-nums">
          {meta}
        </div>
      )}
    </div>
  );
}

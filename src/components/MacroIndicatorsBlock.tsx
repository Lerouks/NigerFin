import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import type { MacroIndicator } from '@/data/ins-indicators';
import { AnimatedNumber } from './AnimatedNumber';

interface MacroIndicatorsBlockProps {
  /** Heading principal */
  title: string;
  /** Sous-titre ou contexte */
  subtitle?: string;
  /** Liste des indicateurs à afficher */
  indicators: MacroIndicator[];
  /** Nombre de colonnes desktop (2, 3 ou 4) */
  columns?: 2 | 3 | 4;
  /** Lien vers la source officielle */
  sourceLabel?: string;
  /** Période globale du snapshot */
  asOf?: string;
}

const TREND_ICON = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  neutral: Minus,
} as const;

const TREND_COLOR = {
  up: 'text-emerald-600',
  down: 'text-red-500',
  neutral: 'text-gray-500',
} as const;

/**
 * Bloc d'indicateurs macroéconomiques type "terminal Bloomberg".
 * Server component pur, SSR, zéro JS supplémentaire.
 * Réutilisable sur /niger, /marches, /economie.
 */
export function MacroIndicatorsBlock({
  title,
  subtitle,
  indicators,
  columns = 3,
  sourceLabel,
  asOf,
}: MacroIndicatorsBlockProps) {
  if (indicators.length === 0) return null;

  const gridCols = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
  }[columns];

  return (
    <section>
      {/* En-tete : titre + date. Le point median separe le titre de sa date,
          en monospace, dans l'esprit « chaque chiffre porte sa date ». */}
      <div className="flex items-end justify-between mb-6 flex-wrap gap-3 pb-4 border-b border-black/10">
        <div>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-[#111]">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[14px] text-gray-500 mt-2 max-w-2xl">{subtitle}</p>
          )}
        </div>
        {asOf && (
          <div className="font-mono text-[11px] uppercase tracking-[0.04em] text-gray-500 tabular-nums pb-1">
            au {asOf}
          </div>
        )}
      </div>

      {/*
        ANTI-CARTE : ces indicateurs sont comparables entre eux, ils se lisent
        donc en LIGNES alignees separees par un filet de 1 px, pas en mosaique de
        cartes arrondies. On lit une colonne de chiffres d'un coup d'oeil, comme
        sur un terminal. Sur large ecran, deux ou trois colonnes de lignes.
      */}
      <div className={`grid grid-cols-1 ${gridCols} gap-x-10`}>
        {indicators.map((kpi) => {
          const TrendIcon = TREND_ICON[kpi.trend ?? 'neutral'];
          const trendClass = TREND_COLOR[kpi.trend ?? 'neutral'];
          return (
            <div
              key={kpi.id}
              className="flex items-baseline justify-between gap-4 py-4 border-b border-black/8"
            >
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-[#111] leading-tight">
                  {kpi.label}
                </div>
                {kpi.context && (
                  <p className="text-[12px] leading-snug text-gray-500 mt-1 max-w-xs">
                    {kpi.context}
                  </p>
                )}
                {/* Source + periode, en monospace : la provenance du chiffre. */}
                <div className="font-mono text-[10px] uppercase tracking-[0.04em] text-gray-400 mt-1.5 tabular-nums">
                  {[kpi.source, kpi.period].filter(Boolean).join(' · ')}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="flex items-baseline justify-end gap-1">
                  <AnimatedNumber
                    value={kpi.value}
                    className="text-xl md:text-2xl font-bold text-[#111] tabular-nums leading-none"
                  />
                  <span className="text-[12px] text-gray-500 font-medium">{kpi.unit}</span>
                </div>
                {kpi.yearChange && (
                  <span
                    className={`inline-flex items-center gap-0.5 text-[12px] font-semibold tabular-nums mt-1 ${trendClass}`}
                  >
                    <TrendIcon className="w-3.5 h-3.5" />
                    {kpi.yearChange}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer source */}
      {sourceLabel && (
        <p className="font-mono text-[11px] text-gray-400 mt-5 text-right uppercase tracking-[0.04em]">
          {sourceLabel}
        </p>
      )}
    </section>
  );
}

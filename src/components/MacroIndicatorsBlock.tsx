import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import type { MacroIndicator } from '@/data/ins-indicators';
import { AnimatedNumber } from './AnimatedNumber';

interface MacroIndicatorsBlockProps {
  /** Eyebrow gold uppercase */
  eyebrow: string;
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
  eyebrow,
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
      {/* Header */}
      <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-3">
            <div className="h-px w-6 bg-gold/60" />
            <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-gold">
              {eyebrow}
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-[#111]">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[14px] text-gray-500 mt-2 max-w-2xl">{subtitle}</p>
          )}
        </div>
        {asOf && (
          <div className="text-right">
            <div className="text-[11px] tracking-[0.12em] uppercase text-gray-500">
              Snapshot
            </div>
            <div className="text-[13px] text-gray-600 font-medium tabular-nums">
              {asOf}
            </div>
          </div>
        )}
      </div>

      {/* Grid d'indicateurs */}
      <div className={`grid grid-cols-1 ${gridCols} gap-4`}>
        {indicators.map((kpi) => {
          const TrendIcon = TREND_ICON[kpi.trend ?? 'neutral'];
          const trendClass = TREND_COLOR[kpi.trend ?? 'neutral'];
          return (
            <article
              key={kpi.id}
              className="bg-white rounded-xl border border-black/[0.06] p-5 hover:border-black/[0.12] transition-colors"
            >
              {/* Label + period */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-[#111] leading-tight">
                    {kpi.label}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    {kpi.period}
                  </div>
                </div>
                {kpi.yearChange && (
                  <span
                    className={`inline-flex items-center gap-0.5 text-[12px] font-semibold tabular-nums ${trendClass}`}
                  >
                    <TrendIcon className="w-3.5 h-3.5" />
                    {kpi.yearChange}
                  </span>
                )}
              </div>

              {/* Value */}
              <div className="flex items-baseline gap-1.5 mb-3">
                <AnimatedNumber
                  value={kpi.value}
                  className="text-2xl md:text-[28px] font-bold text-[#111] tabular-nums leading-none"
                />
                <span className="text-[13px] text-gray-500 font-medium">
                  {kpi.unit}
                </span>
              </div>

              {/* Context (1 phrase) */}
              {kpi.context && (
                <p className="text-[12px] leading-relaxed text-gray-600 mb-2">
                  {kpi.context}
                </p>
              )}

              {/* Source */}
              <div className="text-[10px] tracking-[0.08em] uppercase text-gray-500 mt-3 pt-3 border-t border-black/[0.04]">
                {kpi.source}
              </div>
            </article>
          );
        })}
      </div>

      {/* Footer source */}
      {sourceLabel && (
        <p className="text-[12px] text-gray-500 mt-6 text-right">
          {sourceLabel}
        </p>
      )}
    </section>
  );
}

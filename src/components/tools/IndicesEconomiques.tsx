'use client';

import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ChartTooltip } from './ChartTooltip';
import { useNigerMacro } from '@/hooks/useNigerMacro';
import { MacroIndicatorsBlock } from '@/components/MacroIndicatorsBlock';
import { NIGER_MACRO_INDICATORS, INS_LAST_UPDATE } from '@/data/ins-indicators';

/**
 * Affiche exclusivement les indicateurs réellement récupérés depuis les
 * APIs publiques (Banque mondiale, FMI). Aucune valeur n'est hardcodée :
 * si l'API ne renvoie pas un indicateur, la carte correspondante n'est
 * pas affichée. Cela évite d'induire l'utilisateur en erreur avec des
 * chiffres figés.
 */

type Trend = 'up' | 'down' | 'flat';

interface Indicator {
  key: string;
  name: string;
  value: string;
  change: string | null;
  trend: Trend;
  /** Positive = vert, negative = rouge. Dépend de l'indicateur : une
   *  inflation en baisse est "positive", une dette en baisse aussi,
   *  un PIB en hausse est positif, etc. */
  positive: boolean | null;
}

function fmtFCFA(n: number): string {
  return Math.round(n).toLocaleString('fr-FR');
}

/** Dernier point non-null d'une série year/value. */
function latestValue<T extends { year: number; value: number | null }>(arr: T[]): T | null {
  const sorted = [...arr].filter((x) => x.value !== null).sort((a, b) => b.year - a.year);
  return sorted[0] ?? null;
}

function prevValue<T extends { year: number; value: number | null }>(arr: T[]): T | null {
  const sorted = [...arr].filter((x) => x.value !== null).sort((a, b) => b.year - a.year);
  return sorted[1] ?? null;
}

function diffTrend(current: number, previous: number | null): { change: string; trend: Trend } {
  if (previous === null || previous === undefined) {
    return { change: '', trend: 'flat' };
  }
  const delta = current - previous;
  if (Math.abs(delta) < 0.05) return { change: '= stable', trend: 'flat' };
  const sign = delta > 0 ? '+' : '';
  return {
    change: `${sign}${delta.toFixed(1)} pts`,
    trend: delta > 0 ? 'up' : 'down',
  };
}

export function IndicesEconomiques() {
  const { data: macroData, isLoading, lastUpdated, source } = useNigerMacro();

  const { indicators, gdpSeries } = useMemo(() => {
    if (!macroData) return { indicators: [] as Indicator[], gdpSeries: [] as { year: string; pib: number; croissance: number }[] };

    const wb = macroData.worldBank;
    const imf = macroData.imf;
    const list: Indicator[] = [];

    // ── PIB (USD converti en FCFA, 1 USD ≈ 655.957 XOF parité fixe) ──
    const latestGDP = latestValue(wb.gdp);
    if (latestGDP && latestGDP.value !== null) {
      const gdpBillionFCFA = Math.round((latestGDP.value * 655.957) / 1e9);
      const prevGDP = prevValue(wb.gdp);
      const pctChange = prevGDP && prevGDP.value ? ((latestGDP.value - prevGDP.value) / prevGDP.value) * 100 : null;
      list.push({
        key: 'gdp',
        name: `PIB Niger (${latestGDP.year})`,
        value: `${fmtFCFA(gdpBillionFCFA)} Mrd FCFA`,
        change: pctChange !== null ? `${pctChange > 0 ? '+' : ''}${pctChange.toFixed(1)}%` : null,
        trend: pctChange === null ? 'flat' : pctChange > 0 ? 'up' : pctChange < 0 ? 'down' : 'flat',
        positive: pctChange === null ? null : pctChange >= 0,
      });
    }

    // ── Croissance du PIB (IMF prioritaire, fallback WB) ──
    const latestGrowth = latestValue(imf.realGDPGrowth) || latestValue(wb.gdpGrowth);
    const prevGrowth = prevValue(imf.realGDPGrowth) || prevValue(wb.gdpGrowth);
    if (latestGrowth && latestGrowth.value !== null) {
      const { change, trend } = diffTrend(latestGrowth.value, prevGrowth?.value ?? null);
      list.push({
        key: 'growth',
        name: `Croissance réelle (${latestGrowth.year})`,
        value: `${latestGrowth.value.toFixed(1)}%`,
        change: change || null,
        trend,
        positive: latestGrowth.value >= 0,
      });
    }

    // ── Inflation ──
    const latestInflation = latestValue(wb.inflation) || latestValue(imf.inflationRate);
    const prevInflation = prevValue(wb.inflation) || prevValue(imf.inflationRate);
    if (latestInflation && latestInflation.value !== null) {
      const { change, trend } = diffTrend(latestInflation.value, prevInflation?.value ?? null);
      list.push({
        key: 'inflation',
        name: `Inflation IPC (${latestInflation.year})`,
        value: `${latestInflation.value.toFixed(1)}%`,
        change: change || null,
        trend,
        // Pour l'inflation, une baisse est positive
        positive: trend === 'flat' ? null : trend === 'down',
      });
    }

    // ── Dette publique / PIB ──
    const latestDebt = latestValue(wb.debt);
    const prevDebt = prevValue(wb.debt);
    if (latestDebt && latestDebt.value !== null) {
      const { change, trend } = diffTrend(latestDebt.value, prevDebt?.value ?? null);
      list.push({
        key: 'debt',
        name: `Dette publique / PIB (${latestDebt.year})`,
        value: `${latestDebt.value.toFixed(1)}%`,
        change: change || null,
        trend,
        // Une dette qui baisse est positive
        positive: trend === 'flat' ? null : trend === 'down',
      });
    }

    // ── PIB par habitant ──
    const latestGDPPC = latestValue(wb.gdpPerCapita);
    const prevGDPPC = prevValue(wb.gdpPerCapita);
    if (latestGDPPC && latestGDPPC.value !== null) {
      const pcFCFA = Math.round(latestGDPPC.value * 655.957);
      const pctChange = prevGDPPC && prevGDPPC.value
        ? ((latestGDPPC.value - prevGDPPC.value) / prevGDPPC.value) * 100
        : null;
      list.push({
        key: 'gdpPerCapita',
        name: `PIB / habitant (${latestGDPPC.year})`,
        value: `${fmtFCFA(pcFCFA)} FCFA`,
        change: pctChange !== null ? `${pctChange > 0 ? '+' : ''}${pctChange.toFixed(1)}%` : null,
        trend: pctChange === null ? 'flat' : pctChange > 0 ? 'up' : 'down',
        positive: pctChange === null ? null : pctChange >= 0,
      });
    }

    // ── Population ──
    const latestPop = latestValue(wb.population);
    const prevPop = prevValue(wb.population);
    if (latestPop && latestPop.value !== null) {
      const popM = (latestPop.value / 1e6).toFixed(1);
      const pctChange = prevPop && prevPop.value
        ? ((latestPop.value - prevPop.value) / prevPop.value) * 100
        : null;
      list.push({
        key: 'population',
        name: `Population (${latestPop.year})`,
        value: `${popM} M hab.`,
        change: pctChange !== null ? `${pctChange > 0 ? '+' : ''}${pctChange.toFixed(2)}%` : null,
        trend: 'up',
        positive: true,
      });
    }

    // ── Balance courante (% PIB, FMI) ──
    const latestCA = latestValue(imf.currentAccountBalance);
    const prevCA = prevValue(imf.currentAccountBalance);
    if (latestCA && latestCA.value !== null) {
      const { change, trend } = diffTrend(latestCA.value, prevCA?.value ?? null);
      list.push({
        key: 'currentAccount',
        name: `Balance courante / PIB (${latestCA.year})`,
        value: `${latestCA.value > 0 ? '+' : ''}${latestCA.value.toFixed(1)}%`,
        change: change || null,
        trend,
        positive: latestCA.value >= 0,
      });
    }

    // ── Recettes publiques / PIB (FMI) ──
    const latestRev = latestValue(imf.governmentRevenue);
    const prevRev = prevValue(imf.governmentRevenue);
    if (latestRev && latestRev.value !== null) {
      const { change, trend } = diffTrend(latestRev.value, prevRev?.value ?? null);
      list.push({
        key: 'revenue',
        name: `Recettes publiques / PIB (${latestRev.year})`,
        value: `${latestRev.value.toFixed(1)}%`,
        change: change || null,
        trend,
        positive: trend === 'flat' ? null : trend === 'up',
      });
    }

    // ── Série PIB pour le graphique d'évolution ──
    const gdpByYear = [...wb.gdp]
      .filter((x) => x.value !== null)
      .sort((a, b) => a.year - b.year);

    const gdpGrowthMap = new Map<number, number>();
    for (const g of wb.gdpGrowth) {
      if (g.value !== null) gdpGrowthMap.set(g.year, g.value);
    }

    const series = gdpByYear.map((point) => ({
      year: String(point.year),
      pib: Math.round(((point.value ?? 0) * 655.957) / 1e9),
      croissance: Math.round(((gdpGrowthMap.get(point.year) ?? 0) * 100)) / 100,
    }));

    return { indicators: list, gdpSeries: series };
  }, [macroData]);

  const trendIcon = (trend: Trend) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4" aria-hidden="true" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4" aria-hidden="true" />;
    return <Minus className="w-4 h-4" aria-hidden="true" />;
  };

  return (
    <div className="space-y-8">
      {/* Graphique d'évolution du PIB */}
      <div className="bg-white border border-black/[0.06] rounded-xl p-6">
        <h3 className="text-[11px] tracking-[0.15em] uppercase text-gray-400 mb-4">
          Évolution du PIB du Niger (Mrd FCFA)
        </h3>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
          </div>
        ) : gdpSeries.length > 0 ? (
          <div className="h-64" aria-label="Évolution annuelle du PIB du Niger en milliards de FCFA">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={gdpSeries} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorGDP" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d4a843" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#d4a843" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={{ stroke: '#e5e5e5' }} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`}
                />
                <Tooltip
                  content={<ChartTooltip
                    formatValue={(v) => `${v.toLocaleString('fr-FR')} Mrd FCFA`}
                    formatName={(n) => n === 'pib' ? 'PIB' : n}
                  />}
                  isAnimationActive={false}
                  cursor={{ stroke: '#d4a843', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area
                  type="monotone"
                  dataKey="pib"
                  stroke="#d4a843"
                  strokeWidth={2}
                  fill="url(#colorGDP)"
                  dot={{ r: 3, fill: '#d4a843' }}
                  name="PIB"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-[13px] text-gray-400">
            Données indisponibles
          </div>
        )}
      </div>

      {/* Grille d'indicateurs */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-white border border-black/[0.06] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : indicators.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {indicators.map((idx) => (
            <div
              key={idx.key}
              className="flex items-center justify-between p-5 bg-white border border-black/[0.06] rounded-xl hover:border-black/[0.12] transition-colors"
            >
              <div>
                <p className="text-[13px] text-gray-500">{idx.name}</p>
                <p className="text-xl font-bold mt-0.5">{idx.value}</p>
              </div>
              {idx.change && (
                <span
                  className={`text-[13px] font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1 ${
                    idx.positive === true
                      ? 'bg-emerald-50 text-emerald-600'
                      : idx.positive === false
                        ? 'bg-red-50 text-red-600'
                        : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {trendIcon(idx.trend)}
                  {idx.change}
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center bg-white border border-black/[0.06] rounded-xl text-[14px] text-gray-500">
          Aucun indicateur disponible pour le moment. Les APIs publiques (Banque mondiale, FMI) sont temporairement indisponibles.
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-[12px] text-gray-400">
          Sources : Banque mondiale, FMI{source ? ` (${source})` : ''}. Parité XOF/USD fixe à 655,957.
        </p>
        {lastUpdated && (
          <p className="text-[10px] text-gray-400">
            Mis à jour : {new Date(lastUpdated).toLocaleDateString('fr-FR')}
          </p>
        )}
      </div>

      {/* ── Conjoncture récente INS Niger ─────────────────────────
          Complément aux séries longues Banque mondiale / FMI ci-dessus.
          Données plus fraîches (T4 2025 + Avril 2026), publiées
          directement par l'Institut National de la Statistique du Niger.
          Source de vérité : src/data/ins-indicators.ts
      */}
      <div className="pt-8 mt-4 border-t border-black/[0.06]">
        <MacroIndicatorsBlock
          eyebrow="Conjoncture récente"
          title="Indicateurs INS Niger temps quasi-réel"
          subtitle="Publications officielles INS Niger plus récentes que les séries Banque mondiale / FMI, qui ont 1 à 2 ans de lag. Mise à jour à chaque nouveau bulletin INS."
          indicators={NIGER_MACRO_INDICATORS}
          columns={3}
          asOf={INS_LAST_UPDATE}
        />
      </div>
    </div>
  );
}

'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useNigerMacro } from '@/hooks/useNigerMacro';

const FALLBACK_INDICES = [
  { name: 'PIB Niger (2025)', value: '10 250 Mrd FCFA', change: '+6,2%', positive: true, numValue: 10250 },
  { name: 'Inflation (IPC)', value: '3,8%', change: '+0,4 pts', positive: false, numValue: 3.8 },
  { name: 'Taux directeur BCEAO', value: '3,50%', change: '0,00', positive: true, numValue: 3.5 },
  { name: 'Dette publique / PIB', value: '42,3%', change: '-1,2 pts', positive: true, numValue: 42.3 },
  { name: 'Réserves de change', value: '4,8 mois', change: '+0,3', positive: true, numValue: 4.8 },
  { name: 'Taux de chômage', value: '15,2%', change: '-0,8 pts', positive: true, numValue: 15.2 },
  { name: 'Balance commerciale', value: '-380 Mrd FCFA', change: '+45 Mrd', positive: true, numValue: -380 },
  { name: 'IDE entrants', value: '620 Mrd FCFA', change: '+12%', positive: true, numValue: 620 },
];

const FALLBACK_CHART = [
  { name: 'PIB', value: 10250, unit: 'Mrd' },
  { name: 'IDE', value: 620, unit: 'Mrd' },
  { name: 'Balance', value: -380, unit: 'Mrd' },
];

export function IndicesEconomiques() {
  const { data: macroData, isLoading, lastUpdated, source } = useNigerMacro();

  const { indices, chartData } = useMemo(() => {
    if (!macroData) return { indices: FALLBACK_INDICES, chartData: FALLBACK_CHART };

    const wb = macroData.worldBank;
    const imf = macroData.imf;

    const latest = <T extends { year: number; value: number | null }>(arr: T[]) => {
      const sorted = [...arr].sort((a, b) => b.year - a.year);
      return sorted[0] ?? null;
    };

    const prev = <T extends { year: number; value: number | null }>(arr: T[]) => {
      const sorted = [...arr].sort((a, b) => b.year - a.year);
      return sorted[1] ?? null;
    };

    const updatedIndices = [...FALLBACK_INDICES];

    // PIB
    const latestGDP = latest(wb.gdp);
    if (latestGDP?.value) {
      const gdpBillionFCFA = Math.round(latestGDP.value / 1e9 * 655.957);
      const prevGDP = prev(wb.gdp);
      const change = prevGDP?.value ? (((latestGDP.value - prevGDP.value) / prevGDP.value) * 100) : 0;
      updatedIndices[0] = {
        name: `PIB Niger (${latestGDP.year})`,
        value: `${gdpBillionFCFA.toLocaleString('fr-FR')} Mrd FCFA`,
        change: `${change > 0 ? '+' : ''}${change.toFixed(1)}%`,
        positive: change >= 0,
        numValue: gdpBillionFCFA,
      };
    }

    // Inflation
    const latestInflation = latest(wb.inflation) || (imf.inflationRate.length ? latest(imf.inflationRate) : null);
    const prevInflation = prev(wb.inflation) || (imf.inflationRate.length ? prev(imf.inflationRate) : null);
    if (latestInflation?.value !== null && latestInflation?.value !== undefined) {
      const diff = prevInflation?.value !== null && prevInflation?.value !== undefined ? latestInflation.value - prevInflation.value : 0;
      updatedIndices[1] = {
        name: `Inflation (${latestInflation.year})`,
        value: `${latestInflation.value.toFixed(1)}%`,
        change: `${diff > 0 ? '+' : ''}${diff.toFixed(1)} pts`,
        positive: diff <= 0,
        numValue: latestInflation.value,
      };
    }

    // Debt
    const latestDebt = latest(wb.debt);
    const prevDebt = prev(wb.debt);
    if (latestDebt?.value !== null && latestDebt?.value !== undefined) {
      const diff = prevDebt?.value !== null && prevDebt?.value !== undefined ? latestDebt.value - prevDebt.value : 0;
      updatedIndices[3] = {
        name: `Dette publique / PIB (${latestDebt.year})`,
        value: `${latestDebt.value.toFixed(1)}%`,
        change: `${diff > 0 ? '+' : ''}${diff.toFixed(1)} pts`,
        positive: diff <= 0,
        numValue: latestDebt.value,
      };
    }

    // GDP Growth from IMF
    const latestGrowth = imf.realGDPGrowth.length ? latest(imf.realGDPGrowth) : latest(wb.gdpGrowth);
    const gdpIndex = updatedIndices[0];
    if (gdpIndex && latestGrowth?.value !== null && latestGrowth?.value !== undefined) {
      updatedIndices[0] = {
        ...gdpIndex,
        change: `Croissance : ${latestGrowth.value > 0 ? '+' : ''}${latestGrowth.value.toFixed(1)}%`,
        positive: latestGrowth.value >= 0,
      };
    }

    // Chart data
    const gdpChart = latestGDP?.value ? Math.round(latestGDP.value / 1e9 * 655.957) : 10250;
    const updatedChart = [
      { name: 'PIB', value: gdpChart, unit: 'Mrd' },
      { name: 'IDE', value: 620, unit: 'Mrd' },
      { name: 'Balance', value: -380, unit: 'Mrd' },
    ];

    return { indices: updatedIndices, chartData: updatedChart };
  }, [macroData]);

  return (
    <div className="space-y-8">
      {/* Chart */}
      <div className="bg-white border border-black/[0.06] rounded-xl p-6">
        <h3 className="text-[11px] tracking-[0.15em] uppercase text-gray-400 mb-4">
          Indicateurs clés (Mrd FCFA)
        </h3>
        {isLoading ? (
          <div className="h-52 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="h-52" aria-label="Graphique des indicateurs économiques clés du Niger en milliards de FCFA">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={{ stroke: '#e5e5e5' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#111', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px', padding: '8px 12px' }}
                  formatter={((value: number) => [`${value.toLocaleString('fr-FR')} Mrd FCFA`]) as never}
                />
                <Bar dataKey="value" fill="#111" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Indices grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {indices.map((idx) => (
          <div key={idx.name} className="flex items-center justify-between p-5 bg-white border border-black/[0.06] rounded-xl hover:border-black/[0.12] transition-colors">
            <div>
              <p className="text-[13px] text-gray-500">{idx.name}</p>
              <p className="text-xl font-bold mt-0.5">{idx.value}</p>
            </div>
            <span className={`text-[13px] font-semibold px-2.5 py-1 rounded-full ${
              idx.positive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
            }`}>
              {idx.change}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[12px] text-gray-400">
          Sources : Banque mondiale, FMI, BCEAO, INS Niger
          {source && ` (${source})`}
        </p>
        {lastUpdated && (
          <p className="text-[10px] text-gray-400">
            Mis à jour : {new Date(lastUpdated).toLocaleDateString('fr-FR')}
          </p>
        )}
      </div>
    </div>
  );
}

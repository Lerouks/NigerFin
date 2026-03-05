'use client';

import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ResultSummary } from './ResultSummary';
import { AutoAnalysis } from './AutoAnalysis';
import { EmptyState } from './EmptyState';
import { DollarSign } from 'lucide-react';

function fmt(n: number): string {
  return Math.round(n).toLocaleString('fr-FR');
}

export function SimulateurSalaire() {
  const [grossSalary, setGrossSalary] = useState<string>('');

  const numGross = Number(grossSalary) || 0;
  const hasInput = numGross > 0;

  const calc = useMemo(() => {
    if (!hasInput) return null;
    const cnss = numGross * 0.0525;
    const its = Math.max(0, (numGross - cnss - 50000) * 0.15);
    const netSalary = numGross - cnss - its;
    const totalDeductions = cnss + its;

    return { cnss, its, netSalary, totalDeductions };
  }, [hasInput, numGross]);

  const chartData = calc ? [
    { name: 'Salaire net', value: Math.round(calc.netSalary), color: '#111111' },
    { name: 'CNSS', value: Math.round(calc.cnss), color: '#d4d4d4' },
    { name: 'ITS', value: Math.round(calc.its), color: '#ef4444' },
  ] : [];

  const analysis = useMemo(() => {
    if (!calc) return [];
    const lines: string[] = [];
    const netPercent = (calc.netSalary / numGross * 100).toFixed(1);
    const deductPercent = (calc.totalDeductions / numGross * 100).toFixed(1);

    lines.push(
      `Pour un salaire brut de ${fmt(numGross)} FCFA, le salaire net estime est de ${fmt(calc.netSalary)} FCFA, soit ${netPercent}% du brut.`
    );

    lines.push(
      `Les retenues totales representent ${deductPercent}% du salaire brut : ${fmt(calc.cnss)} FCFA de CNSS (5,25%) et ${fmt(calc.its)} FCFA d'ITS.`
    );

    if (numGross < 100000) {
      lines.push('A ce niveau de salaire, les retenues sont minimales. L\'ITS est faible grace a l\'abattement de base.');
    } else if (numGross < 500000) {
      lines.push('Les cotisations restent moderees. L\'ITS represente une part croissante des retenues.');
    } else {
      lines.push('A ce niveau de remuneration, l\'ITS constitue la part principale des retenues. Des strategies d\'optimisation fiscale peuvent etre envisagees.');
    }

    return lines;
  }, [calc, numGross]);

  return (
    <div className="space-y-8">
      <div className="bg-white border border-black/[0.06] rounded-xl p-6">
        <h3 className="text-[11px] tracking-[0.15em] uppercase text-gray-400 mb-5">
          Salaire brut
        </h3>
        <div className="max-w-md">
          <label className="block text-[13px] font-medium text-gray-700 mb-2">Salaire brut mensuel (FCFA)</label>
          <input type="number" value={grossSalary} onChange={(e) => setGrossSalary(e.target.value)} placeholder="Ex: 500 000"
            className="w-full border border-black/[0.08] px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-[#fafaf9] text-[15px]" />
        </div>
      </div>

      {!hasInput ? (
        <EmptyState icon={DollarSign} message="Saisissez votre salaire brut pour voir l'estimation du net." />
      ) : calc ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#111] text-white p-6 rounded-xl">
              <p className="text-[12px] text-white/40 uppercase tracking-wider mb-1">Salaire net estime</p>
              <p className="text-2xl font-bold">{fmt(calc.netSalary)} FCFA</p>
            </div>
            <div className="bg-white border border-black/[0.06] p-6 rounded-xl">
              <p className="text-[12px] text-gray-400 uppercase tracking-wider mb-1">CNSS (5,25%)</p>
              <p className="text-2xl font-bold">{fmt(calc.cnss)} FCFA</p>
            </div>
            <div className="bg-white border border-black/[0.06] p-6 rounded-xl">
              <p className="text-[12px] text-gray-400 uppercase tracking-wider mb-1">ITS estime</p>
              <p className="text-2xl font-bold">{fmt(calc.its)} FCFA</p>
            </div>
          </div>

          {/* Salary distribution chart */}
          <div className="bg-white border border-black/[0.06] rounded-xl p-6">
            <h3 className="text-[11px] tracking-[0.15em] uppercase text-gray-400 mb-4">
              Repartition du salaire brut
            </h3>
            <div className="flex items-center gap-6">
              <div className="w-40 h-40 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={2} dataKey="value" stroke="none">
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={((value: number) => `${value.toLocaleString('fr-FR')} FCFA`) as never}
                      contentStyle={{ background: '#111', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px', padding: '8px 12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {chartData.map((item) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <div>
                      <p className="text-[13px] text-gray-500">{item.name}</p>
                      <p className="text-[15px] font-semibold">{((item.value / numGross) * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ResultSummary
              items={[
                { label: 'Salaire net', value: `${fmt(calc.netSalary)} FCFA`, highlight: true },
                { label: 'CNSS', value: `${fmt(calc.cnss)} FCFA` },
                { label: 'ITS', value: `${fmt(calc.its)} FCFA` },
                { label: 'Total retenues', value: `${fmt(calc.totalDeductions)} FCFA` },
                { label: 'Salaire brut', value: `${fmt(numGross)} FCFA` },
              ]}
            />
            <AutoAnalysis paragraphs={analysis} />
          </div>

          <p className="text-[12px] text-gray-400">* Estimation basee sur les taux CNSS et ITS standards au Niger. Consultez un comptable pour un calcul precis.</p>
        </>
      ) : null}
    </div>
  );
}

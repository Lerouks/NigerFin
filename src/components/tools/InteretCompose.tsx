'use client';

import { useState, useMemo } from 'react';
import { GraphRepartition } from './GraphRepartition';
import { GraphEvolution } from './GraphEvolution';
import { ResultSummary } from './ResultSummary';
import { AutoAnalysis } from './AutoAnalysis';
import { EmptyState } from './EmptyState';
import { TrendingUp } from 'lucide-react';

function fmt(n: number): string {
  return Math.round(n).toLocaleString('fr-FR');
}

const COMPOUNDS = [
  { value: 1, label: 'Annuelle' },
  { value: 4, label: 'Trimestrielle' },
  { value: 12, label: 'Mensuelle' },
  { value: 365, label: 'Quotidienne' },
];

export function InteretCompose() {
  const [capital, setCapital] = useState<string>('');
  const [rate, setRate] = useState<string>('');
  const [years, setYears] = useState<string>('');
  const [compoundsPerYear, setCompoundsPerYear] = useState(12);

  const numCapital = Number(capital) || 0;
  const numRate = Number(rate) || 0;
  const numYears = Number(years) || 0;
  const hasInput = numCapital > 0 && numRate > 0 && numYears > 0;

  const calc = useMemo(() => {
    if (!hasInput) return null;
    const total = numCapital * Math.pow(1 + numRate / 100 / compoundsPerYear, compoundsPerYear * numYears);
    const interest = total - numCapital;

    // Simple interest for comparison
    const simpleInterest = numCapital * (numRate / 100) * numYears;
    const bonus = interest - simpleInterest;

    // Evolution chart data
    const schedule: { label: string; capitalRestant: number; interetsCumules: number }[] = [];
    for (let y = 0; y <= numYears; y++) {
      const valueAtY = numCapital * Math.pow(1 + numRate / 100 / compoundsPerYear, compoundsPerYear * y);
      schedule.push({
        label: `An ${y}`,
        capitalRestant: Math.round(valueAtY),
        interetsCumules: Math.round(valueAtY - numCapital),
      });
    }

    return { total, interest, simpleInterest, bonus, schedule };
  }, [hasInput, numCapital, numRate, numYears, compoundsPerYear]);

  const analysis = useMemo(() => {
    if (!calc) return [];
    const lines: string[] = [];

    lines.push(
      `Un capital de ${fmt(numCapital)} FCFA placé à ${numRate}% avec capitalisation ${COMPOUNDS.find(c => c.value === compoundsPerYear)?.label.toLowerCase()} pendant ${numYears} an${numYears > 1 ? 's' : ''} atteindra ${fmt(calc.total)} FCFA.`
    );

    lines.push(
      `Les intérêts composés s'élèvent à ${fmt(calc.interest)} FCFA, contre ${fmt(calc.simpleInterest)} FCFA en intérêt simple. L'effet de la capitalisation apporte un bonus de ${fmt(calc.bonus)} FCFA.`
    );

    if (numYears >= 10) {
      lines.push('Sur une durée longue, l\'effet des intérêts composés est significatif. Le capital bénéficie pleinement de l\'effet \"boule de neige\" de la capitalisation.');
    } else if (numYears >= 5) {
      lines.push('La durée est suffisante pour que l\'effet des intérêts composés se manifeste de manière notable.');
    } else {
      lines.push('Sur une courte durée, la différence entre intérêts simples et composés reste modérée. L\'effet se renforce avec le temps.');
    }

    return lines;
  }, [calc, numCapital, numRate, numYears, compoundsPerYear]);

  return (
    <div className="space-y-8">
      <div className="bg-white border border-black/[0.06] rounded-xl p-6">
        <h3 className="text-[11px] tracking-[0.15em] uppercase text-gray-400 mb-5">
          Paramètres du placement
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-2">Capital initial (FCFA)</label>
            <input type="number" value={capital} onChange={(e) => setCapital(e.target.value)} placeholder="Ex: 1 000 000"
              className="w-full border border-black/[0.08] px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-[#fafaf9] text-[15px]" />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-2">Taux annuel (%)</label>
            <input type="number" step="0.1" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="Ex: 7"
              className="w-full border border-black/[0.08] px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-[#fafaf9] text-[15px]" />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-2">Durée (années)</label>
            <input type="number" value={years} onChange={(e) => setYears(e.target.value)} placeholder="Ex: 5"
              className="w-full border border-black/[0.08] px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-[#fafaf9] text-[15px]" />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-2">Capitalisation</label>
            <select value={compoundsPerYear} onChange={(e) => setCompoundsPerYear(Number(e.target.value))}
              className="w-full border border-black/[0.08] px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-[#fafaf9] text-[15px]">
              {COMPOUNDS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {!hasInput ? (
        <EmptyState icon={TrendingUp} message="Renseignez le capital, le taux et la durée pour calculer les intérêts composés." />
      ) : calc ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#111] text-white p-6 rounded-xl">
              <p className="text-[12px] text-white/40 uppercase tracking-wider mb-1">Intérêts composés</p>
              <p className="text-2xl font-bold">{fmt(calc.interest)} FCFA</p>
            </div>
            <div className="bg-white border border-black/[0.06] p-6 rounded-xl">
              <p className="text-[12px] text-gray-400 uppercase tracking-wider mb-1">Montant final</p>
              <p className="text-2xl font-bold">{fmt(calc.total)} FCFA</p>
            </div>
            <div className="bg-white border border-black/[0.06] p-6 rounded-xl">
              <p className="text-[12px] text-gray-400 uppercase tracking-wider mb-1">Bonus vs intérêt simple</p>
              <p className="text-2xl font-bold text-emerald-600">+{fmt(calc.bonus)} FCFA</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GraphRepartition capital={numCapital} interest={calc.interest} />
            <GraphEvolution data={calc.schedule} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ResultSummary
              items={[
                { label: 'Intérêts composés', value: `${fmt(calc.interest)} FCFA`, highlight: true },
                { label: 'Montant final', value: `${fmt(calc.total)} FCFA` },
                { label: 'Intérêts simples (comparaison)', value: `${fmt(calc.simpleInterest)} FCFA` },
                { label: 'Bonus capitalisation', value: `+${fmt(calc.bonus)} FCFA` },
                { label: 'Capital initial', value: `${fmt(numCapital)} FCFA` },
              ]}
            />
            <AutoAnalysis paragraphs={analysis} />
          </div>
        </>
      ) : null}
    </div>
  );
}

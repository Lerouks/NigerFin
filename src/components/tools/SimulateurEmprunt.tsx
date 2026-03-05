'use client';

import { useState, useMemo } from 'react';
import { GraphRepartition } from './GraphRepartition';
import { GraphEvolution } from './GraphEvolution';
import { ResultSummary } from './ResultSummary';
import { AutoAnalysis } from './AutoAnalysis';
import { EmptyState } from './EmptyState';
import { Calculator } from 'lucide-react';

function fmt(n: number): string {
  return Math.round(n).toLocaleString('fr-FR');
}

export function SimulateurEmprunt() {
  const [amount, setAmount] = useState<string>('');
  const [rate, setRate] = useState<string>('');
  const [duration, setDuration] = useState<string>('');

  const numAmount = Number(amount) || 0;
  const numRate = Number(rate) || 0;
  const numDuration = Number(duration) || 0;
  const hasInput = numAmount > 0 && numRate > 0 && numDuration > 0;

  const calc = useMemo(() => {
    if (!hasInput) return null;
    const monthlyRate = numRate / 100 / 12;
    const monthly = monthlyRate > 0
      ? (numAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -numDuration))
      : numAmount / numDuration;
    const totalCost = monthly * numDuration;
    const totalInterest = totalCost - numAmount;

    // Amortization schedule for chart
    const schedule: { label: string; capitalRestant: number; interetsCumules: number }[] = [];
    let remaining = numAmount;
    let cumulInterest = 0;
    const step = Math.max(1, Math.floor(numDuration / 12));
    for (let m = 0; m <= numDuration; m += step) {
      if (m === 0) {
        schedule.push({ label: 'M0', capitalRestant: remaining, interetsCumules: 0 });
        continue;
      }
      // Calculate remaining after m months
      let rem = numAmount;
      let cumInt = 0;
      for (let i = 0; i < m; i++) {
        const intPayment = rem * monthlyRate;
        const principalPayment = monthly - intPayment;
        rem -= principalPayment;
        cumInt += intPayment;
      }
      schedule.push({
        label: `M${m}`,
        capitalRestant: Math.max(0, Math.round(rem)),
        interetsCumules: Math.round(cumInt),
      });
    }
    // Ensure last month is included
    if (schedule[schedule.length - 1]?.label !== `M${numDuration}`) {
      schedule.push({
        label: `M${numDuration}`,
        capitalRestant: 0,
        interetsCumules: Math.round(totalInterest),
      });
    }

    return { monthly, totalCost, totalInterest, schedule };
  }, [hasInput, numAmount, numRate, numDuration]);

  const analysis = useMemo(() => {
    if (!calc) return [];
    const years = numDuration / 12;
    const lines: string[] = [];

    lines.push(
      `Pour un emprunt de ${fmt(numAmount)} FCFA sur ${years < 1 ? `${numDuration} mois` : `${years.toFixed(1).replace('.0', '')} an${years > 1 ? 's' : ''}`} à un taux de ${numRate}%, la mensualité estimée est de ${fmt(calc.monthly)} FCFA.`
    );

    const interestRatio = (calc.totalInterest / calc.totalCost) * 100;
    lines.push(
      `Sur la durée totale, les intérêts représentent ${interestRatio.toFixed(1)}% du coût du crédit, soit ${fmt(calc.totalInterest)} FCFA.`
    );

    // Rate interpretation
    if (numRate <= 5) {
      lines.push('Le taux appliqué est faible, ce qui est favorable pour l\'emprunteur. Les conditions de ce prêt sont avantageuses.');
    } else if (numRate <= 10) {
      lines.push('Le taux appliqué est dans la moyenne du marché. Comparez plusieurs offres pour optimiser le coût total.');
    } else {
      lines.push('Le taux appliqué est élevé. Envisagez de négocier avec votre banque ou de raccourcir la durée pour réduire le coût total des intérêts.');
    }

    // Duration interpretation
    if (numDuration <= 12) {
      lines.push('La durée courte limite le coût total des intérêts mais entraîne des mensualités plus élevées.');
    } else if (numDuration <= 60) {
      lines.push('La durée est modérée, offrant un bon équilibre entre mensualité et coût total.');
    } else {
      lines.push('La durée longue réduit la mensualité mais augmente significativement le coût total des intérêts. Réduire la durée du prêt diminuerait le coût total mais augmenterait la mensualité.');
    }

    return lines;
  }, [calc, numAmount, numRate, numDuration]);

  return (
    <div className="space-y-8">
      {/* Input fields */}
      <div className="bg-white border border-black/[0.06] rounded-xl p-6">
        <h3 className="text-[11px] tracking-[0.15em] uppercase text-gray-400 mb-5">
          Paramètres de l&apos;emprunt
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-2">
              Montant (FCFA)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Ex: 5 000 000"
              className="w-full border border-black/[0.08] px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-[#fafaf9] text-[15px]"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-2">
              Taux annuel (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="Ex: 8"
              className="w-full border border-black/[0.08] px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-[#fafaf9] text-[15px]"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-2">
              Durée (mois)
            </label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="Ex: 24"
              className="w-full border border-black/[0.08] px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-[#fafaf9] text-[15px]"
            />
          </div>
        </div>
      </div>

      {/* Empty state or results */}
      {!hasInput ? (
        <EmptyState icon={Calculator} />
      ) : calc ? (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#111] text-white p-6 rounded-xl">
              <p className="text-[12px] text-white/40 uppercase tracking-wider mb-1">Mensualité</p>
              <p className="text-2xl font-bold">{fmt(calc.monthly)} FCFA</p>
            </div>
            <div className="bg-white border border-black/[0.06] p-6 rounded-xl">
              <p className="text-[12px] text-gray-400 uppercase tracking-wider mb-1">Coût total du crédit</p>
              <p className="text-2xl font-bold">{fmt(calc.totalCost)} FCFA</p>
            </div>
            <div className="bg-white border border-black/[0.06] p-6 rounded-xl">
              <p className="text-[12px] text-gray-400 uppercase tracking-wider mb-1">Total des intérêts</p>
              <p className="text-2xl font-bold">{fmt(calc.totalInterest)} FCFA</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GraphRepartition capital={numAmount} interest={calc.totalInterest} />
            <GraphEvolution data={calc.schedule} />
          </div>

          {/* Summary + Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ResultSummary
              items={[
                { label: 'Mensualité estimée', value: `${fmt(calc.monthly)} FCFA`, highlight: true },
                { label: 'Coût total des intérêts', value: `${fmt(calc.totalInterest)} FCFA` },
                { label: 'Coût total du crédit', value: `${fmt(calc.totalCost)} FCFA` },
                { label: 'Montant emprunté', value: `${fmt(numAmount)} FCFA` },
                { label: 'Taux annuel', value: `${numRate}%` },
                { label: 'Durée', value: `${numDuration} mois` },
              ]}
            />
            <AutoAnalysis paragraphs={analysis} />
          </div>
        </>
      ) : null}
    </div>
  );
}

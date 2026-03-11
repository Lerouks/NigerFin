'use client';

import { useState, useMemo } from 'react';
import { GraphRepartition } from './GraphRepartition';
import { GraphEvolution } from './GraphEvolution';
import { ResultSummary } from './ResultSummary';
import { AutoAnalysis } from './AutoAnalysis';
import { EmptyState } from './EmptyState';
import { PdfDownloadButton } from '@/components/PdfDownloadButton';
import { Percent } from 'lucide-react';

function fmt(n: number): string {
  return Math.round(n).toLocaleString('fr-FR');
}

export function InteretSimple() {
  const [capital, setCapital] = useState<string>('');
  const [rate, setRate] = useState<string>('');
  const [years, setYears] = useState<string>('');

  const numCapital = Number(capital) || 0;
  const numRate = Number(rate) || 0;
  const numYears = Number(years) || 0;
  const hasInput = numCapital > 0 && numRate > 0 && numYears > 0;

  const calc = useMemo(() => {
    if (!hasInput) return null;
    const interest = numCapital * (numRate / 100) * numYears;
    const total = numCapital + interest;
    const annualInterest = numCapital * (numRate / 100);

    // Evolution data per year
    const schedule: { label: string; capitalRestant: number; interetsCumules: number }[] = [];
    for (let y = 0; y <= numYears; y++) {
      schedule.push({
        label: `An ${y}`,
        capitalRestant: numCapital,
        interetsCumules: Math.round(numCapital * (numRate / 100) * y),
      });
    }

    return { interest, total, annualInterest, schedule };
  }, [hasInput, numCapital, numRate, numYears]);

  const analysis = useMemo(() => {
    if (!calc) return [];
    const lines: string[] = [];

    lines.push(
      `Pour un placement de ${fmt(numCapital)} FCFA à un taux d'intérêt simple de ${numRate}% sur ${numYears} an${numYears > 1 ? 's' : ''}, les intérêts générés s'élèvent à ${fmt(calc.interest)} FCFA.`
    );

    lines.push(
      `Le montant total récupéré à l'échéance sera de ${fmt(calc.total)} FCFA, soit un gain de ${((calc.interest / numCapital) * 100).toFixed(1)}% sur le capital initial.`
    );

    if (numRate <= 3) {
      lines.push('Le taux est faible. Ce placement est conservateur et protège le capital, mais le rendement reste limité face à l\'inflation.');
    } else if (numRate <= 7) {
      lines.push('Le taux est dans la moyenne du marché. Ce placement offre un rendement correct avec un risque modéré.');
    } else {
      lines.push('Le taux est élevé. Vérifiez la fiabilité de l\'émetteur car un rendement supérieur implique généralement un risque plus important.');
    }

    lines.push(
      `Chaque année, le placement génère ${fmt(calc.annualInterest)} FCFA d'intérêts. Contrairement aux intérêts composés, ce montant reste constant.`
    );

    return lines;
  }, [calc, numCapital, numRate, numYears]);

  return (
    <div className="space-y-8">
      <div className="bg-white border border-black/[0.06] rounded-xl p-6">
        <h3 className="text-[11px] tracking-[0.15em] uppercase text-gray-400 mb-5">
          Paramètres du placement
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-2">Capital (FCFA)</label>
            <input type="number" value={capital} onChange={(e) => setCapital(e.target.value)} placeholder="Ex: 1 000 000"
              className="w-full border border-black/[0.08] px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-[#fafaf9] text-[15px]" />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-2">Taux annuel (%)</label>
            <input type="number" step="0.1" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="Ex: 5"
              className="w-full border border-black/[0.08] px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-[#fafaf9] text-[15px]" />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-2">Durée (années)</label>
            <input type="number" value={years} onChange={(e) => setYears(e.target.value)} placeholder="Ex: 3"
              className="w-full border border-black/[0.08] px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-[#fafaf9] text-[15px]" />
          </div>
        </div>
      </div>

      {!hasInput ? (
        <EmptyState icon={Percent} message="Saisissez le capital, le taux et la durée pour voir les résultats." />
      ) : calc ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#111] text-white p-6 rounded-xl">
              <p className="text-[12px] text-white/40 uppercase tracking-wider mb-1">Intérêts gagnés</p>
              <p className="text-2xl font-bold">{fmt(calc.interest)} FCFA</p>
            </div>
            <div className="bg-white border border-black/[0.06] p-6 rounded-xl">
              <p className="text-[12px] text-gray-400 uppercase tracking-wider mb-1">Montant total</p>
              <p className="text-2xl font-bold">{fmt(calc.total)} FCFA</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GraphRepartition capital={numCapital} interest={calc.interest} />
            <GraphEvolution data={calc.schedule} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ResultSummary
              items={[
                { label: 'Intérêts gagnés', value: `${fmt(calc.interest)} FCFA`, highlight: true },
                { label: 'Montant total', value: `${fmt(calc.total)} FCFA` },
                { label: 'Intérêt annuel', value: `${fmt(calc.annualInterest)} FCFA` },
                { label: 'Capital initial', value: `${fmt(numCapital)} FCFA` },
                { label: 'Taux annuel', value: `${numRate}%` },
                { label: 'Durée', value: `${numYears} an${numYears > 1 ? 's' : ''}` },
              ]}
            />
            <AutoAnalysis paragraphs={analysis} />
          </div>

          <PdfDownloadButton
            hasResults={!!calc}
            options={{
              title: 'Intérêt Simple',
              params: [
                { label: 'Capital initial', value: `${fmt(numCapital)} FCFA` },
                { label: 'Taux annuel', value: `${numRate}%` },
                { label: 'Durée', value: `${numYears} an${numYears > 1 ? 's' : ''}` },
              ],
              results: [
                { label: 'Intérêts gagnés', value: `${fmt(calc.interest)} FCFA` },
                { label: 'Montant total', value: `${fmt(calc.total)} FCFA` },
                { label: 'Intérêt annuel', value: `${fmt(calc.annualInterest)} FCFA` },
              ],
              table: {
                head: ['Année', 'Capital', 'Intérêts cumulés'],
                body: calc.schedule.map((row) => [row.label, `${fmt(row.capitalRestant)} FCFA`, `${fmt(row.interetsCumules)} FCFA`]),
              },
            }}
          />
        </>
      ) : null}
    </div>
  );
}

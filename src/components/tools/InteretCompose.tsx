'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { ResultSummary } from './ResultSummary';

// Perf H-1 : recharts (~80 KB) charge seulement quand l'utilisateur calcule.
const GraphRepartition = dynamic(
  () => import('./GraphRepartition').then((m) => m.GraphRepartition),
  { ssr: false },
);
const GraphEvolution = dynamic(
  () => import('./GraphEvolution').then((m) => m.GraphEvolution),
  { ssr: false },
);
import { AutoAnalysis } from './AutoAnalysis';
import { EmptyState } from './EmptyState';
import { PdfDownloadButton } from '@/components/PdfDownloadButton';
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

const CONTRIB_FREQUENCIES = [
  { value: 0, label: 'Aucun versement' },
  { value: 12, label: 'Mensuel' },
  { value: 4, label: 'Trimestriel' },
  { value: 1, label: 'Annuel' },
];

export function InteretCompose() {
  const [capital, setCapital] = useState<string>('');
  const [rate, setRate] = useState<string>('');
  const [years, setYears] = useState<string>('');
  const [compoundsPerYear, setCompoundsPerYear] = useState(12);
  const [contribAmount, setContribAmount] = useState<string>('');
  const [contribFrequency, setContribFrequency] = useState<number>(0);

  const numCapital = Number(capital) || 0;
  const numRate = Number(rate) || 0;
  const numYears = Number(years) || 0;
  const numContrib = Number(contribAmount) || 0;
  const hasContrib = numContrib > 0 && contribFrequency > 0;
  const hasInput = numCapital > 0 && numRate > 0 && numYears > 0;

  const calc = useMemo(() => {
    if (!hasInput) return null;

    const annualRate = numRate / 100;
    // Effective monthly rate, derived from chosen compounding cadence.
    // This keeps the compounding choice honest while simulating month by month,
    // which is the finest resolution required by contribution frequencies.
    const monthlyRate = Math.pow(1 + annualRate / compoundsPerYear, compoundsPerYear / 12) - 1;
    const totalMonths = Math.round(numYears * 12);

    // Month-by-month simulation.
    let balance = numCapital;
    let totalContributions = 0;
    const schedule: { label: string; capitalRestant: number; interetsCumules: number }[] = [
      { label: 'An 0', capitalRestant: Math.round(balance), interetsCumules: 0 },
    ];

    // Contribution triggers: every N months where N = 12 / contribFrequency.
    // contribFrequency values: 12 (monthly → every 1 month), 4 (quarterly → every 3),
    // 1 (annual → every 12). 0 means no contribution.
    const contribEveryNMonths = hasContrib ? 12 / contribFrequency : 0;

    for (let m = 1; m <= totalMonths; m++) {
      // 1. Apply compound interest for this month
      balance = balance * (1 + monthlyRate);

      // 2. Add periodic contribution at end of the period (ordinary annuity)
      if (hasContrib && contribEveryNMonths > 0 && m % contribEveryNMonths === 0) {
        balance += numContrib;
        totalContributions += numContrib;
      }

      // 3. Snapshot at each year boundary for the chart/table
      if (m % 12 === 0) {
        const year = m / 12;
        schedule.push({
          label: `An ${year}`,
          capitalRestant: Math.round(balance),
          interetsCumules: Math.round(balance - numCapital - totalContributions),
        });
      }
    }

    const total = balance;
    const totalInvested = numCapital + totalContributions;
    const interest = total - totalInvested;

    // Simple interest comparison (on initial capital only, for reference)
    const simpleInterest = numCapital * annualRate * numYears;
    const bonus = interest - simpleInterest;

    return {
      total,
      interest,
      simpleInterest,
      bonus,
      schedule,
      totalContributions,
      totalInvested,
    };
  }, [hasInput, numCapital, numRate, numYears, compoundsPerYear, hasContrib, numContrib, contribFrequency]);

  const analysis = useMemo(() => {
    if (!calc) return [];
    const lines: string[] = [];
    const compoundLabel = COMPOUNDS.find((c) => c.value === compoundsPerYear)?.label.toLowerCase();

    lines.push(
      `Un capital de ${fmt(numCapital)} FCFA placé à ${numRate}% avec capitalisation ${compoundLabel} pendant ${numYears} an${numYears > 1 ? 's' : ''} atteindra ${fmt(calc.total)} FCFA.`,
    );

    if (hasContrib && calc.totalContributions > 0) {
      const freqLabel = CONTRIB_FREQUENCIES.find((f) => f.value === contribFrequency)?.label.toLowerCase();
      lines.push(
        `Vos versements ${freqLabel}s de ${fmt(numContrib)} FCFA totalisent ${fmt(calc.totalContributions)} FCFA sur la période, pour un investissement cumulé de ${fmt(calc.totalInvested)} FCFA (capital initial + versements).`,
      );
      lines.push(
        `Les intérêts générés (${fmt(calc.interest)} FCFA) représentent ${((calc.interest / calc.totalInvested) * 100).toFixed(1)}% de votre effort d'épargne. C'est la puissance des versements réguliers combinés à la capitalisation.`,
      );
    } else {
      lines.push(
        `Les intérêts composés s'élèvent à ${fmt(calc.interest)} FCFA, contre ${fmt(calc.simpleInterest)} FCFA en intérêt simple. L'effet de la capitalisation apporte un bonus de ${fmt(calc.bonus)} FCFA.`,
      );
    }

    if (numYears >= 10) {
      lines.push(
        'Sur une durée longue, l\'effet des intérêts composés est significatif. Le capital bénéficie pleinement de l\'effet "boule de neige" de la capitalisation.',
      );
    } else if (numYears >= 5) {
      lines.push(
        'La durée est suffisante pour que l\'effet des intérêts composés se manifeste de manière notable.',
      );
    } else {
      lines.push(
        'Sur une courte durée, la différence entre intérêts simples et composés reste modérée. L\'effet se renforce avec le temps.',
      );
    }

    return lines;
  }, [calc, numCapital, numRate, numYears, compoundsPerYear, hasContrib, numContrib, contribFrequency]);

  return (
    <div className="space-y-8">
      <div className="bg-white border border-black/6 rounded-xl p-6">
        <h3 className="text-[11px] tracking-[0.15em] uppercase text-gray-400 mb-5">
          Paramètres du placement
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="ic-capital" className="block text-[13px] font-medium text-gray-700 mb-2">Capital initial (FCFA)</label>
            <input id="ic-capital" type="number" step={100000} min={0} value={capital} onChange={(e) => setCapital(e.target.value)} placeholder="Ex: 1 000 000"
              className="w-full border border-black/8 px-4 py-3 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-black bg-background text-[15px]" />
          </div>
          <div>
            <label htmlFor="ic-taux" className="block text-[13px] font-medium text-gray-700 mb-2">Taux annuel (%)</label>
            <input id="ic-taux" type="number" step="0.1" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="Ex: 7"
              className="w-full border border-black/8 px-4 py-3 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-black bg-background text-[15px]" />
          </div>
          <div>
            <label htmlFor="ic-duree" className="block text-[13px] font-medium text-gray-700 mb-2">Durée (années)</label>
            <input id="ic-duree" type="number" value={years} onChange={(e) => setYears(e.target.value)} placeholder="Ex: 5"
              className="w-full border border-black/8 px-4 py-3 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-black bg-background text-[15px]" />
          </div>
          <div>
            <label htmlFor="ic-capitalisation" className="block text-[13px] font-medium text-gray-700 mb-2">Capitalisation</label>
            <select id="ic-capitalisation" value={compoundsPerYear} onChange={(e) => setCompoundsPerYear(Number(e.target.value))}
              className="w-full border border-black/8 px-4 py-3 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-black bg-background text-[15px]">
              {COMPOUNDS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-black/6">
          <h3 className="text-[11px] tracking-[0.15em] uppercase text-gray-400 mb-5">
            Versements périodiques (optionnel)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="ic-contrib-amount" className="block text-[13px] font-medium text-gray-700 mb-2">Montant du versement (FCFA)</label>
              <input
                id="ic-contrib-amount"
                type="number"
                step={10000}
                min={0}
                value={contribAmount}
                onChange={(e) => setContribAmount(e.target.value)}
                placeholder="Ex: 50 000"
                className="w-full border border-black/8 px-4 py-3 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-black bg-background text-[15px]"
              />
            </div>
            <div>
              <label htmlFor="ic-contrib-freq" className="block text-[13px] font-medium text-gray-700 mb-2">Fréquence</label>
              <select
                id="ic-contrib-freq"
                value={contribFrequency}
                onChange={(e) => setContribFrequency(Number(e.target.value))}
                className="w-full border border-black/8 px-4 py-3 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-black bg-background text-[15px]"
              >
                {CONTRIB_FREQUENCIES.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-3">
            Les versements sont ajoutés en fin de période et génèrent des intérêts à partir de la période suivante.
          </p>
        </div>
      </div>

      {!hasInput ? (
        <EmptyState icon={TrendingUp} message="Renseignez le capital, le taux et la durée pour calculer les intérêts composés." />
      ) : calc ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#111] text-white p-6 rounded-xl">
              <p className="text-[12px] text-white/40 uppercase tracking-wider mb-1">Intérêts générés</p>
              <p className="text-2xl font-bold">{fmt(calc.interest)} FCFA</p>
            </div>
            <div className="bg-white border border-black/6 p-6 rounded-xl">
              <p className="text-[12px] text-gray-400 uppercase tracking-wider mb-1">Montant final</p>
              <p className="text-2xl font-bold">{fmt(calc.total)} FCFA</p>
            </div>
            <div className="bg-white border border-black/6 p-6 rounded-xl">
              <p className="text-[12px] text-gray-400 uppercase tracking-wider mb-1">
                {hasContrib ? 'Total investi' : 'Bonus vs intérêt simple'}
              </p>
              <p className={`text-2xl font-bold ${hasContrib ? '' : 'text-emerald-600'}`}>
                {hasContrib ? `${fmt(calc.totalInvested)} FCFA` : `+${fmt(calc.bonus)} FCFA`}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GraphRepartition
              capital={calc.totalInvested}
              interest={calc.interest}
              title="Composition du montant final"
              capitalLabel={hasContrib ? 'Capital + versements' : 'Capital investi'}
              interestLabel="Intérêts générés"
            />
            <GraphEvolution
              data={calc.schedule}
              title="Évolution du placement"
              capitalLabel="Valeur du placement"
              interestLabel="Intérêts cumulés"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ResultSummary
              items={[
                { label: 'Intérêts générés', value: `${fmt(calc.interest)} FCFA`, highlight: true },
                { label: 'Montant final', value: `${fmt(calc.total)} FCFA` },
                { label: 'Capital initial', value: `${fmt(numCapital)} FCFA` },
                ...(hasContrib
                  ? [
                      { label: 'Total des versements', value: `${fmt(calc.totalContributions)} FCFA` },
                      { label: 'Total investi', value: `${fmt(calc.totalInvested)} FCFA` },
                    ]
                  : [
                      { label: 'Intérêts simples (comparaison)', value: `${fmt(calc.simpleInterest)} FCFA` },
                      { label: 'Bonus capitalisation', value: `+${fmt(calc.bonus)} FCFA` },
                    ]),
              ]}
            />
            <AutoAnalysis paragraphs={analysis} />
          </div>

          <PdfDownloadButton
            hasResults={!!calc}
            options={{
              title: 'Intérêt Composé',
              params: [
                { label: 'Capital initial', value: `${fmt(numCapital)} FCFA` },
                { label: 'Taux annuel', value: `${numRate}%` },
                { label: 'Durée', value: `${numYears} an${numYears > 1 ? 's' : ''}` },
                { label: 'Capitalisation', value: COMPOUNDS.find(c => c.value === compoundsPerYear)?.label || '' },
                ...(hasContrib
                  ? [
                      { label: 'Versement périodique', value: `${fmt(numContrib)} FCFA` },
                      { label: 'Fréquence des versements', value: CONTRIB_FREQUENCIES.find(f => f.value === contribFrequency)?.label || '' },
                    ]
                  : []),
              ],
              results: [
                { label: 'Intérêts générés', value: `${fmt(calc.interest)} FCFA` },
                { label: 'Montant final', value: `${fmt(calc.total)} FCFA` },
                ...(hasContrib
                  ? [
                      { label: 'Total des versements', value: `${fmt(calc.totalContributions)} FCFA` },
                      { label: 'Total investi', value: `${fmt(calc.totalInvested)} FCFA` },
                    ]
                  : [
                      { label: 'Intérêts simples (comparaison)', value: `${fmt(calc.simpleInterest)} FCFA` },
                      { label: 'Bonus capitalisation', value: `+${fmt(calc.bonus)} FCFA` },
                    ]),
              ],
              table: {
                head: ['Année', 'Valeur du capital', 'Intérêts cumulés'],
                body: calc.schedule.map((row) => [row.label, `${fmt(row.capitalRestant)} FCFA`, `${fmt(row.interetsCumules)} FCFA`]),
              },
            }}
          />
        </>
      ) : null}
    </div>
  );
}

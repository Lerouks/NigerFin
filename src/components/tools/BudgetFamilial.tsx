'use client';

import { useState, useMemo } from 'react';
import { Wallet } from 'lucide-react';
import { GraphRepartition } from './GraphRepartition';
import { ResultSummary } from './ResultSummary';
import { AutoAnalysis } from './AutoAnalysis';
import { EmptyState } from './EmptyState';
import { PdfDownloadButton } from '@/components/PdfDownloadButton';

function fmt(n: number): string {
  return Math.round(n).toLocaleString('fr-FR');
}

/**
 * Benchmarks indicatifs pour un foyer nigérien moyen, calibrés sur les
 * études de l'INS Niger, de la BCEAO et d'observations terrain. Ces
 * fourchettes servent de repère pour les recommandations : elles ne
 * constituent pas une norme rigide.
 */
const BENCHMARKS = {
  alimentation: { min: 35, max: 50, label: 'Alimentation' },
  logement: { min: 15, max: 25, label: 'Logement' },
  transport: { min: 8, max: 15, label: 'Transport' },
  scolarite: { min: 5, max: 15, label: 'Scolarité' },
  sante: { min: 5, max: 10, label: 'Santé' },
  autres: { min: 5, max: 12, label: 'Autres' },
  epargne: { min: 10, max: Infinity, label: 'Épargne' },
} as const;

type Category = keyof typeof BENCHMARKS;

const EXPENSE_CATEGORIES: { key: Exclude<Category, 'epargne'>; label: string; placeholder: string; hint: string }[] = [
  { key: 'alimentation', label: 'Alimentation', placeholder: 'Ex: 80 000', hint: 'Marché, boutique, restauration' },
  { key: 'logement', label: 'Logement', placeholder: 'Ex: 50 000', hint: 'Loyer, eau, électricité' },
  { key: 'transport', label: 'Transport', placeholder: 'Ex: 25 000', hint: 'Carburant, taxi, moto, bus' },
  { key: 'scolarite', label: 'Scolarité', placeholder: 'Ex: 30 000', hint: 'Frais de scolarité, fournitures, uniformes' },
  { key: 'sante', label: 'Santé', placeholder: 'Ex: 15 000', hint: 'Consultations, médicaments, mutuelle' },
  { key: 'autres', label: 'Autres dépenses', placeholder: 'Ex: 20 000', hint: 'Habillement, loisirs, imprévus' },
];

export function BudgetFamilial() {
  const [revenus, setRevenus] = useState<string>('');
  const [foyerSize, setFoyerSize] = useState<string>('');
  const [expenses, setExpenses] = useState<Record<Exclude<Category, 'epargne'>, string>>({
    alimentation: '',
    logement: '',
    transport: '',
    scolarite: '',
    sante: '',
    autres: '',
  });

  const numRevenus = Number(revenus) || 0;
  const numFoyer = Number(foyerSize) || 0;
  const numExpenses = {
    alimentation: Number(expenses.alimentation) || 0,
    logement: Number(expenses.logement) || 0,
    transport: Number(expenses.transport) || 0,
    scolarite: Number(expenses.scolarite) || 0,
    sante: Number(expenses.sante) || 0,
    autres: Number(expenses.autres) || 0,
  };

  const hasInput = numRevenus > 0 && Object.values(numExpenses).some((v) => v > 0);

  const calc = useMemo(() => {
    if (!hasInput) return null;

    const totalDepenses = Object.values(numExpenses).reduce((sum, v) => sum + v, 0);
    const reste = numRevenus - totalDepenses;
    const tauxEpargne = numRevenus > 0 ? (reste / numRevenus) * 100 : 0;

    // Compute share of each category as % of income
    const shares: Record<Exclude<Category, 'epargne'>, number> = {
      alimentation: (numExpenses.alimentation / numRevenus) * 100,
      logement: (numExpenses.logement / numRevenus) * 100,
      transport: (numExpenses.transport / numRevenus) * 100,
      scolarite: (numExpenses.scolarite / numRevenus) * 100,
      sante: (numExpenses.sante / numRevenus) * 100,
      autres: (numExpenses.autres / numRevenus) * 100,
    };

    const perPersonDaily = numFoyer > 0 ? totalDepenses / numFoyer / 30 : null;

    return { totalDepenses, reste, tauxEpargne, shares, perPersonDaily };
  }, [hasInput, numRevenus, numFoyer, numExpenses.alimentation, numExpenses.logement, numExpenses.transport, numExpenses.scolarite, numExpenses.sante, numExpenses.autres]);

  const recommendations = useMemo(() => {
    if (!calc) return [];
    const recs: string[] = [];
    const { shares, reste, tauxEpargne } = calc;

    // ─── Balance générale ───
    if (reste < 0) {
      recs.push(
        `Votre budget est en déficit de ${fmt(Math.abs(reste))} FCFA par mois. C'est le signal le plus important : vos dépenses dépassent vos revenus. Identifiez dès ce mois-ci 2 postes à réduire rapidement (souvent alimentation et transport) avant de creuser un endettement.`,
      );
    } else if (tauxEpargne < BENCHMARKS.epargne.min) {
      recs.push(
        `Vous épargnez seulement ${tauxEpargne.toFixed(1)}% de vos revenus (${fmt(reste)} FCFA). L'objectif raisonnable au Niger est de 10% minimum. Mettez en place un virement automatique de ce montant en début de mois vers un compte d'épargne séparé. On n'épargne pas ce qui reste, on dépense ce qui reste après avoir épargné.`,
      );
    } else {
      recs.push(
        `Votre taux d'épargne de ${tauxEpargne.toFixed(1)}% est sain et supérieur à la moyenne nationale. Maintenez cette discipline et envisagez de diversifier cette épargne : compte épargne bancaire, livret BCEAO, placement SGBS/BRVM pour le long terme.`,
      );
    }

    // ─── Alimentation ───
    if (shares.alimentation > BENCHMARKS.alimentation.max) {
      recs.push(
        `Le poste alimentation représente ${shares.alimentation.toFixed(0)}% de vos revenus, c'est nettement au-dessus de la fourchette saine (${BENCHMARKS.alimentation.min}–${BENCHMARKS.alimentation.max}%). Pour réduire : privilégier les marchés de gros (Katako, Grand Marché) en début de mois pour les denrées non périssables (riz, mil, huile), cuisiner en grandes quantités, limiter la restauration à l'extérieur, acheter les produits de saison plutôt que les importations.`,
      );
    } else if (shares.alimentation < BENCHMARKS.alimentation.min && shares.alimentation > 0) {
      recs.push(
        `Votre budget alimentation (${shares.alimentation.toFixed(0)}%) semble modéré. Vérifiez que cela ne se fait pas au détriment de la qualité nutritionnelle du foyer, particulièrement en protéines et en légumes frais.`,
      );
    }

    // ─── Logement ───
    if (shares.logement > BENCHMARKS.logement.max) {
      recs.push(
        `Votre logement absorbe ${shares.logement.toFixed(0)}% de vos revenus, au-dessus des ${BENCHMARKS.logement.max}% recommandés. Options à envisager : négocier le loyer à l'échéance du bail, colocation si célibataire ou jeune foyer, déménagement dans un quartier équivalent mais moins demandé. Pensez aussi aux économies sur l'eau et l'électricité (ampoules LED, gestion de la climatisation).`,
      );
    }

    // ─── Transport ───
    if (shares.transport > BENCHMARKS.transport.max) {
      recs.push(
        `Les dépenses de transport atteignent ${shares.transport.toFixed(0)}% de vos revenus. Pistes concrètes : privilégier la moto-taxi (kabou-kabou) pour les courts trajets, regrouper les déplacements, envisager le covoiturage avec des collègues, ou investir dans un deux-roues personnel si les trajets quotidiens le justifient (rentabilité en 8–18 mois typiquement).`,
      );
    }

    // ─── Scolarité ───
    if (shares.scolarite > BENCHMARKS.scolarite.max) {
      recs.push(
        `Les frais de scolarité représentent ${shares.scolarite.toFixed(0)}% de votre budget. Si vous avez plusieurs enfants, étudiez les bourses offertes par les établissements et les aides du Ministère de l'Éducation. Les écoles publiques performantes restent une alternative crédible. Anticipez aussi l'achat des fournitures en juillet-août (prix plus bas qu'à la rentrée).`,
      );
    }

    // ─── Santé ───
    if (shares.sante > BENCHMARKS.sante.max) {
      recs.push(
        `Votre budget santé (${shares.sante.toFixed(0)}%) est élevé. Envisagez sérieusement une mutuelle santé (AMAMI, SONAR-Vie) qui transforme des dépenses imprévisibles en une cotisation fixe. Pour les soins courants, les Centres de Santé Intégrés (CSI) publics restent la première ligne à privilégier avant les cliniques privées. Constituez aussi un fonds d'urgence santé de 3 mois de dépenses moyennes.`,
      );
    } else if (shares.sante === 0) {
      recs.push(
        `Vous n'avez déclaré aucune dépense de santé. Attention à bien provisionner un budget santé même si vous êtes en bonne santé : les imprévus médicaux sont la première cause de fragilisation budgétaire au Niger. Une enveloppe mensuelle de 5 à 8% du revenu est prudente.`,
      );
    }

    // ─── Autres ───
    if (shares.autres > BENCHMARKS.autres.max) {
      recs.push(
        `Le poste "autres dépenses" (${shares.autres.toFixed(0)}%) est significatif et mal identifié. Pendant un mois, notez chaque dépense de cette catégorie dans un carnet ou une appli : vous découvrirez souvent 2–3 postes cachés (abonnements, achats impulsifs, contributions familiales) qu'on peut optimiser sans sacrifice ressenti.`,
      );
    }

    // ─── Conseils universels ───
    recs.push(
      `Principe du "6 enveloppes" adapté au contexte nigérien : divisez vos revenus en 6 enveloppes dès le jour de paiement. Nécessités (55%), épargne long terme (10%), éducation/santé (10%), loisirs/famille (10%), imprévus (10%), dons/tontines (5%). Cette discipline simple évite 80% des dépassements.`,
    );

    if (numFoyer >= 5) {
      recs.push(
        `Avec un foyer de ${numFoyer} personnes, les achats groupés deviennent très rentables : riz, mil, huile, savon. Un achat trimestriel en gros (Katako, Aouta) peut réduire votre budget alimentation de 15 à 25% par rapport aux achats quotidiens au détail.`,
      );
    }

    return recs;
  }, [calc, numFoyer]);

  const analysis = useMemo(() => {
    if (!calc) return [];
    const lines: string[] = [];

    lines.push(
      `Sur un revenu mensuel de ${fmt(numRevenus)} FCFA, vos dépenses totales s'élèvent à ${fmt(calc.totalDepenses)} FCFA, soit ${((calc.totalDepenses / numRevenus) * 100).toFixed(1)}% de vos revenus.`,
    );

    if (calc.reste >= 0) {
      lines.push(
        `Il vous reste ${fmt(calc.reste)} FCFA par mois, soit un taux d'épargne potentielle de ${calc.tauxEpargne.toFixed(1)}%.`,
      );
    } else {
      lines.push(
        `Votre budget est en déficit de ${fmt(Math.abs(calc.reste))} FCFA. Une action corrective immédiate est recommandée.`,
      );
    }

    if (calc.perPersonDaily !== null) {
      lines.push(
        `Budget quotidien par personne dans le foyer : environ ${fmt(calc.perPersonDaily)} FCFA/jour.`,
      );
    }

    return lines;
  }, [calc, numRevenus]);

  // Data for pie chart: use totalDepenses split between top categories
  const pieData = useMemo(() => {
    if (!calc) return null;
    // GraphRepartition expects (capital, interest): reuse it for "dépenses" vs "épargne"
    return { capital: calc.totalDepenses, interest: Math.max(calc.reste, 0) };
  }, [calc]);

  return (
    <div className="space-y-8">
      <div className="bg-white border border-black/[0.06] rounded-xl p-6">
        <h3 className="text-[11px] tracking-[0.15em] uppercase text-gray-400 mb-5">
          Revenus du foyer
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="bf-revenus" className="block text-[13px] font-medium text-gray-700 mb-2">
              Revenu mensuel net (FCFA)
            </label>
            <input
              id="bf-revenus"
              type="number"
              step={10000}
              min={0}
              value={revenus}
              onChange={(e) => setRevenus(e.target.value)}
              placeholder="Ex: 250 000"
              className="w-full border border-black/[0.08] px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-[#fafaf9] text-[15px]"
            />
            <p className="text-[11px] text-gray-400 mt-1">Cumulé si plusieurs revenus dans le foyer.</p>
          </div>
          <div>
            <label htmlFor="bf-foyer" className="block text-[13px] font-medium text-gray-700 mb-2">
              Taille du foyer (personnes)
            </label>
            <input
              id="bf-foyer"
              type="number"
              min={1}
              value={foyerSize}
              onChange={(e) => setFoyerSize(e.target.value)}
              placeholder="Ex: 5"
              className="w-full border border-black/[0.08] px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-[#fafaf9] text-[15px]"
            />
            <p className="text-[11px] text-gray-400 mt-1">Adultes et enfants à charge.</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-black/[0.06] rounded-xl p-6">
        <h3 className="text-[11px] tracking-[0.15em] uppercase text-gray-400 mb-5">
          Dépenses mensuelles par poste
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {EXPENSE_CATEGORIES.map((cat) => (
            <div key={cat.key}>
              <label htmlFor={`bf-${cat.key}`} className="block text-[13px] font-medium text-gray-700 mb-2">
                {cat.label} (FCFA)
              </label>
              <input
                id={`bf-${cat.key}`}
                type="number"
                step={5000}
                min={0}
                value={expenses[cat.key]}
                onChange={(e) => setExpenses((prev) => ({ ...prev, [cat.key]: e.target.value }))}
                placeholder={cat.placeholder}
                className="w-full border border-black/[0.08] px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-[#fafaf9] text-[15px]"
              />
              <p className="text-[11px] text-gray-400 mt-1">{cat.hint}</p>
            </div>
          ))}
        </div>
      </div>

      {!hasInput ? (
        <EmptyState
          icon={Wallet}
          message="Renseignez vos revenus et au moins une dépense pour obtenir une analyse et des recommandations personnalisées."
        />
      ) : calc ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#111] text-white p-6 rounded-xl">
              <p className="text-[12px] text-white/40 uppercase tracking-wider mb-1">Total dépenses</p>
              <p className="text-2xl font-bold">{fmt(calc.totalDepenses)} FCFA</p>
            </div>
            <div
              className={`p-6 rounded-xl border ${
                calc.reste >= 0 ? 'bg-white border-black/[0.06]' : 'bg-red-50 border-red-200'
              }`}
            >
              <p className="text-[12px] text-gray-400 uppercase tracking-wider mb-1">
                {calc.reste >= 0 ? 'Reste à épargner' : 'Déficit'}
              </p>
              <p className={`text-2xl font-bold ${calc.reste >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {calc.reste >= 0 ? '+' : ''}
                {fmt(calc.reste)} FCFA
              </p>
            </div>
            <div className="bg-white border border-black/[0.06] p-6 rounded-xl">
              <p className="text-[12px] text-gray-400 uppercase tracking-wider mb-1">Taux d&rsquo;épargne</p>
              <p className={`text-2xl font-bold ${calc.tauxEpargne >= 10 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {calc.tauxEpargne.toFixed(1)}%
              </p>
            </div>
          </div>

          {pieData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GraphRepartition
                capital={pieData.capital}
                interest={pieData.interest}
                title="Dépenses vs épargne"
                capitalLabel="Dépenses"
                interestLabel="Reste à épargner"
              />
              <div className="bg-white border border-black/[0.06] rounded-xl p-6">
                <h4 className="text-[11px] tracking-[0.15em] uppercase text-gray-400 mb-4">
                  Répartition par poste (% des revenus)
                </h4>
                <div className="space-y-3">
                  {EXPENSE_CATEGORIES.map((cat) => {
                    const share = calc.shares[cat.key];
                    const benchmark = BENCHMARKS[cat.key];
                    const isHigh = share > benchmark.max;
                    const isLow = share > 0 && share < benchmark.min;
                    return (
                      <div key={cat.key}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[13px] text-gray-700">{cat.label}</span>
                          <span
                            className={`text-[13px] font-semibold ${
                              isHigh ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-emerald-600'
                            }`}
                          >
                            {share.toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isHigh ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(share, 100)}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">
                          Repère : {benchmark.min}–{benchmark.max === Infinity ? '∞' : benchmark.max}%
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ResultSummary
              items={[
                { label: 'Revenu mensuel', value: `${fmt(numRevenus)} FCFA` },
                { label: 'Total des dépenses', value: `${fmt(calc.totalDepenses)} FCFA` },
                {
                  label: calc.reste >= 0 ? 'Reste mensuel' : 'Déficit',
                  value: `${calc.reste >= 0 ? '+' : ''}${fmt(calc.reste)} FCFA`,
                  highlight: true,
                },
                { label: "Taux d'épargne", value: `${calc.tauxEpargne.toFixed(1)}%` },
                ...(calc.perPersonDaily !== null
                  ? [{ label: 'Dépense / personne / jour', value: `${fmt(calc.perPersonDaily)} FCFA` }]
                  : []),
              ]}
            />
            <AutoAnalysis paragraphs={analysis} />
          </div>

          <div className="bg-[#fafaf9] border border-black/[0.06] rounded-xl p-6">
            <h4 className="text-[11px] tracking-[0.15em] uppercase text-gray-400 mb-4">
              Recommandations personnalisées ({recommendations.length})
            </h4>
            <ul className="space-y-3">
              {recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#111] text-white text-[11px] font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-[13px] text-gray-700 leading-relaxed">{rec}</p>
                </li>
              ))}
            </ul>
          </div>

          <PdfDownloadButton
            hasResults={!!calc}
            options={{
              title: 'Simulation de Budget Familial',
              params: [
                { label: 'Revenu mensuel net', value: `${fmt(numRevenus)} FCFA` },
                { label: 'Taille du foyer', value: numFoyer > 0 ? `${numFoyer} personnes` : 'Non renseigné' },
                { label: 'Alimentation', value: `${fmt(numExpenses.alimentation)} FCFA` },
                { label: 'Logement', value: `${fmt(numExpenses.logement)} FCFA` },
                { label: 'Transport', value: `${fmt(numExpenses.transport)} FCFA` },
                { label: 'Scolarité', value: `${fmt(numExpenses.scolarite)} FCFA` },
                { label: 'Santé', value: `${fmt(numExpenses.sante)} FCFA` },
                { label: 'Autres dépenses', value: `${fmt(numExpenses.autres)} FCFA` },
              ],
              results: [
                { label: 'Total des dépenses', value: `${fmt(calc.totalDepenses)} FCFA` },
                {
                  label: calc.reste >= 0 ? 'Reste mensuel (épargne potentielle)' : 'Déficit mensuel',
                  value: `${calc.reste >= 0 ? '+' : ''}${fmt(calc.reste)} FCFA`,
                },
                { label: "Taux d'épargne", value: `${calc.tauxEpargne.toFixed(1)}%` },
                ...(calc.perPersonDaily !== null
                  ? [{ label: 'Dépense / personne / jour', value: `${fmt(calc.perPersonDaily)} FCFA` }]
                  : []),
              ],
              table: {
                head: ['Poste', 'Montant', '% des revenus', 'Repère sain'],
                body: EXPENSE_CATEGORIES.map((cat) => {
                  const benchmark = BENCHMARKS[cat.key];
                  return [
                    cat.label,
                    `${fmt(numExpenses[cat.key])} FCFA`,
                    `${calc.shares[cat.key].toFixed(1)}%`,
                    `${benchmark.min}-${benchmark.max === Infinity ? '∞' : benchmark.max}%`,
                  ];
                }),
              },
              recommendations,
            }}
          />
        </>
      ) : null}
    </div>
  );
}

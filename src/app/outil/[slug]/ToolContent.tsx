'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calculator, Percent, DollarSign, BarChart3, TrendingUp, Lock } from 'lucide-react';
import { useUser, SignInButton } from '@clerk/nextjs';

interface ToolContentProps {
  slug: string;
  title: string;
  description: string;
  isPremium: boolean;
}

function LoanSimulator() {
  const [amount, setAmount] = useState(5000000);
  const [rate, setRate] = useState(8);
  const [duration, setDuration] = useState(24);

  const monthlyRate = rate / 100 / 12;
  const monthly = monthlyRate > 0 ? (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -duration)) : amount / duration;
  const totalCost = monthly * duration;
  const totalInterest = totalCost - amount;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Montant (FCFA)</label>
          <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Taux annuel (%)</label>
          <input type="number" step="0.1" value={rate} onChange={(e) => setRate(Number(e.target.value))} className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Durée (mois)</label>
          <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-black text-white p-6 rounded-lg">
          <p className="text-sm text-gray-400 mb-1">Mensualité</p>
          <p className="text-2xl font-bold">{Math.round(monthly).toLocaleString('fr-FR')} FCFA</p>
        </div>
        <div className="bg-gray-100 p-6 rounded-lg">
          <p className="text-sm text-gray-500 mb-1">Coût total du crédit</p>
          <p className="text-2xl font-bold">{Math.round(totalCost).toLocaleString('fr-FR')} FCFA</p>
        </div>
        <div className="bg-gray-100 p-6 rounded-lg">
          <p className="text-sm text-gray-500 mb-1">Total des intérêts</p>
          <p className="text-2xl font-bold">{Math.round(totalInterest).toLocaleString('fr-FR')} FCFA</p>
        </div>
      </div>
    </div>
  );
}

function SimpleInterest() {
  const [capital, setCapital] = useState(1000000);
  const [rate, setRate] = useState(5);
  const [years, setYears] = useState(3);
  const interest = capital * (rate / 100) * years;
  const total = capital + interest;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div><label className="block text-sm font-medium mb-2">Capital (FCFA)</label><input type="number" value={capital} onChange={(e) => setCapital(Number(e.target.value))} className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" /></div>
        <div><label className="block text-sm font-medium mb-2">Taux annuel (%)</label><input type="number" step="0.1" value={rate} onChange={(e) => setRate(Number(e.target.value))} className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" /></div>
        <div><label className="block text-sm font-medium mb-2">Durée (années)</label><input type="number" value={years} onChange={(e) => setYears(Number(e.target.value))} className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" /></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-black text-white p-6 rounded-lg"><p className="text-sm text-gray-400 mb-1">Intérêts gagnés</p><p className="text-2xl font-bold">{Math.round(interest).toLocaleString('fr-FR')} FCFA</p></div>
        <div className="bg-gray-100 p-6 rounded-lg"><p className="text-sm text-gray-500 mb-1">Montant total</p><p className="text-2xl font-bold">{Math.round(total).toLocaleString('fr-FR')} FCFA</p></div>
      </div>
    </div>
  );
}

function SalarySimulator() {
  const [grossSalary, setGrossSalary] = useState(500000);
  const cnss = grossSalary * 0.0525;
  const its = Math.max(0, (grossSalary - cnss - 50000) * 0.15);
  const netSalary = grossSalary - cnss - its;

  return (
    <div className="space-y-8">
      <div>
        <label className="block text-sm font-medium mb-2">Salaire brut mensuel (FCFA)</label>
        <input type="number" value={grossSalary} onChange={(e) => setGrossSalary(Number(e.target.value))} className="w-full max-w-md border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-100 p-6 rounded-lg"><p className="text-sm text-gray-500 mb-1">CNSS (5,25%)</p><p className="text-2xl font-bold">{Math.round(cnss).toLocaleString('fr-FR')} FCFA</p></div>
        <div className="bg-gray-100 p-6 rounded-lg"><p className="text-sm text-gray-500 mb-1">ITS estimé</p><p className="text-2xl font-bold">{Math.round(its).toLocaleString('fr-FR')} FCFA</p></div>
        <div className="bg-black text-white p-6 rounded-lg"><p className="text-sm text-gray-400 mb-1">Salaire net estimé</p><p className="text-2xl font-bold">{Math.round(netSalary).toLocaleString('fr-FR')} FCFA</p></div>
      </div>
      <p className="text-xs text-gray-400">* Estimation basée sur les taux CNSS et ITS standards au Niger.</p>
    </div>
  );
}

function EconomicIndices() {
  const indices = [
    { name: 'PIB Niger (2025)', value: '10 250 Mrd FCFA', change: '+6,2%', positive: true },
    { name: 'Inflation (IPC)', value: '3,8%', change: '+0,4 pts', positive: false },
    { name: 'Taux directeur BCEAO', value: '3,50%', change: '0,00', positive: true },
    { name: 'Dette publique / PIB', value: '42,3%', change: '-1,2 pts', positive: true },
    { name: 'Réserves de change (mois)', value: '4,8 mois', change: '+0,3', positive: true },
    { name: 'Taux de chômage', value: '15,2%', change: '-0,8 pts', positive: true },
    { name: 'Balance commerciale', value: '-380 Mrd FCFA', change: '+45 Mrd', positive: true },
    { name: 'IDE entrants', value: '620 Mrd FCFA', change: '+12%', positive: true },
  ];

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {indices.map((idx) => (
          <div key={idx.name} className="flex items-center justify-between p-5 border border-gray-200 rounded-lg hover:border-gray-400 transition-colors">
            <div><p className="text-sm text-gray-500">{idx.name}</p><p className="text-xl font-bold">{idx.value}</p></div>
            <span className={`text-sm font-semibold ${idx.positive ? 'text-green-600' : 'text-red-600'}`}>{idx.change}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-4">* Données indicatives. Sources : BCEAO, INS Niger, FMI.</p>
    </div>
  );
}

function CompoundInterest() {
  const [capital, setCapital] = useState(1000000);
  const [rate, setRate] = useState(7);
  const [years, setYears] = useState(5);
  const [compoundsPerYear, setCompoundsPerYear] = useState(12);

  const total = capital * Math.pow(1 + rate / 100 / compoundsPerYear, compoundsPerYear * years);
  const interest = total - capital;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div><label className="block text-sm font-medium mb-2">Capital initial (FCFA)</label><input type="number" value={capital} onChange={(e) => setCapital(Number(e.target.value))} className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" /></div>
        <div><label className="block text-sm font-medium mb-2">Taux annuel (%)</label><input type="number" step="0.1" value={rate} onChange={(e) => setRate(Number(e.target.value))} className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" /></div>
        <div><label className="block text-sm font-medium mb-2">Durée (années)</label><input type="number" value={years} onChange={(e) => setYears(Number(e.target.value))} className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" /></div>
        <div>
          <label className="block text-sm font-medium mb-2">Capitalisation</label>
          <select value={compoundsPerYear} onChange={(e) => setCompoundsPerYear(Number(e.target.value))} className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white">
            <option value={1}>Annuelle</option>
            <option value={4}>Trimestrielle</option>
            <option value={12}>Mensuelle</option>
            <option value={365}>Quotidienne</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-black text-white p-6 rounded-lg"><p className="text-sm text-gray-400 mb-1">Intérêts composés</p><p className="text-2xl font-bold">{Math.round(interest).toLocaleString('fr-FR')} FCFA</p></div>
        <div className="bg-gray-100 p-6 rounded-lg"><p className="text-sm text-gray-500 mb-1">Montant final</p><p className="text-2xl font-bold">{Math.round(total).toLocaleString('fr-FR')} FCFA</p></div>
      </div>
    </div>
  );
}

const toolComponents: Record<string, React.ComponentType> = {
  'simulateur-emprunt': LoanSimulator,
  'interet-simple': SimpleInterest,
  'simulateur-salaire': SalarySimulator,
  'indices-economiques': EconomicIndices,
  'interet-compose': CompoundInterest,
};

const toolIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'simulateur-emprunt': Calculator,
  'interet-simple': Percent,
  'simulateur-salaire': DollarSign,
  'indices-economiques': BarChart3,
  'interet-compose': TrendingUp,
};

export function ToolContent({ slug, title, description, isPremium }: ToolContentProps) {
  const { isSignedIn } = useUser();
  const ToolComponent = toolComponents[slug];
  const Icon = toolIcons[slug] || Calculator;

  const needsGate = isPremium && !isSignedIn;

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <section className="bg-[#111] text-white py-10 md:py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/#outils" className="inline-flex items-center gap-1.5 text-[13px] text-white/40 hover:text-white/70 transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            Retour aux outils
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/[0.08] rounded-xl flex items-center justify-center">
              <Icon className="w-6 h-6 text-white/70" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{title}</h1>
                {isPremium && (
                  <span className="text-[10px] bg-white/10 text-white/60 px-2.5 py-1 rounded-full tracking-wider uppercase">
                    Premium
                  </span>
                )}
              </div>
              <p className="text-white/40 text-[14px] mt-1">{description}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 md:py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {needsGate ? (
            <div className="text-center py-20 bg-white border border-black/[0.06] rounded-xl">
              <Lock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-3">Outil Premium</h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Connectez-vous et abonnez-vous pour accéder à cet outil professionnel.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <SignInButton mode="modal">
                  <button className="bg-[#111] text-white px-8 py-3 rounded-lg hover:bg-[#333] transition-colors text-[14px]">
                    Se connecter
                  </button>
                </SignInButton>
                <Link href="/pricing" className="border border-black/[0.1] px-8 py-3 rounded-lg hover:bg-black/5 transition-colors text-[14px]">
                  Voir les abonnements
                </Link>
              </div>
            </div>
          ) : ToolComponent ? (
            <ToolComponent />
          ) : null}
        </div>
      </section>
    </div>
  );
}

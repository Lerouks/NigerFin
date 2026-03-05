import Link from 'next/link';
import {
  BookOpen,
  TrendingUp,
  BarChart3,
  Landmark,
  Banknote,
  PiggyBank,
  LineChart,
  Wallet,
  Scale,
  ShieldCheck,
  Globe,
  Briefcase,
  Building2,
  Coins,
  Clock,
  type LucideIcon,
} from 'lucide-react';

const categories: { id: string; title: string; icon: LucideIcon; available: boolean }[] = [
  { id: 'bases-finance', title: 'Les bases de la finance', icon: BookOpen, available: true },
  { id: 'bourse-marches', title: 'Bourse & Marchés', icon: TrendingUp, available: true },
  { id: 'analyse-technique', title: 'Analyse technique', icon: BarChart3, available: true },
  { id: 'analyse-fondamentale', title: 'Analyse fondamentale', icon: LineChart, available: true },
  { id: 'economie-macro', title: 'Économie & Macro', icon: Landmark, available: true },
  { id: 'epargne-investissement', title: 'Épargne & Investissement', icon: PiggyBank, available: true },
  { id: 'gestion-budget', title: 'Gestion de budget', icon: Wallet, available: true },
  { id: 'brvm-uemoa', title: 'BRVM & UEMOA', icon: Globe, available: true },
  { id: 'fiscalite-droit', title: 'Fiscalité & Droit', icon: Scale, available: true },
  { id: 'crypto-blockchain', title: 'Crypto & Blockchain', icon: Coins, available: false },
  { id: 'immobilier', title: 'Immobilier', icon: Building2, available: false },
  { id: 'entrepreneuriat', title: 'Entrepreneuriat', icon: Briefcase, available: false },
  { id: 'assurance-prevoyance', title: 'Assurance & Prévoyance', icon: ShieldCheck, available: false },
  { id: 'banque-credit', title: 'Banque & Crédit', icon: Banknote, available: false },
  { id: 'psychologie-trading', title: 'Psychologie du trading', icon: Clock, available: false },
];

export default function EducationPage() {
  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Hero */}
      <section className="bg-[#111] text-white py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-[11px] tracking-[0.2em] uppercase text-white/40 block mb-4">
            Rubrique
          </span>
          <h1 className="text-4xl md:text-5xl mb-3">Éducation</h1>
          <p className="text-white/50 text-[16px] max-w-xl">
            Apprenez la finance, l&apos;économie et les marchés à votre rythme.
            Choisissez une catégorie pour commencer.
          </p>
        </div>
      </section>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((cat) => {
            const Icon = cat.icon;

            if (cat.available) {
              return (
                <Link
                  key={cat.id}
                  href={`/education/${cat.id}`}
                  className="group relative flex flex-col justify-between rounded-xl p-5 h-[160px] md:h-[180px] text-left transition-all duration-150 border bg-[#1a1a1a] border-white/[0.06] text-white hover:border-white/20 hover:bg-[#222] hover:shadow-lg hover:-translate-y-0.5"
                >
                  <Icon className="w-7 h-7 text-white/70 group-hover:text-white transition-colors" />
                  <p className="text-[14px] font-semibold leading-tight">{cat.title}</p>
                </Link>
              );
            }

            return (
              <div
                key={cat.id}
                className="relative flex flex-col justify-between rounded-xl p-5 h-[160px] md:h-[180px] text-left border bg-[#1a1a1a] border-white/[0.04] text-white/30 cursor-not-allowed"
              >
                <Icon className="w-7 h-7 text-white/20" />
                <div>
                  <p className="text-[14px] font-semibold leading-tight">{cat.title}</p>
                  <span className="text-[10px] text-white/20 mt-1 block">Bientôt disponible</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

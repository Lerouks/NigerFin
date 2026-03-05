import Link from 'next/link';
import { Calculator, TrendingUp, Percent, DollarSign, BarChart3, ArrowRight, Lock } from 'lucide-react';

interface Tool {
  name: string;
  slug: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface PlanCardProps {
  title: string;
  badge: string;
  tools: Tool[];
  isPremium?: boolean;
}

function PlanCard({ title, badge, tools, isPremium = false }: PlanCardProps) {
  return (
    <div
      className={`rounded-xl overflow-hidden border transition-all duration-300 ${
        isPremium
          ? 'bg-[#111] text-white border-white/10'
          : 'bg-white border-black/[0.06] hover:border-black/[0.1]'
      }`}
    >
      <div
        className={`px-6 pt-6 pb-5 ${isPremium ? 'border-b border-white/[0.06]' : 'border-b border-black/[0.05]'}`}
      >
        <span
          className={`inline-block text-[10px] tracking-[0.15em] uppercase mb-3 ${
            isPremium ? 'text-white/40' : 'text-gray-400'
          }`}
        >
          {badge}
        </span>
        <h3 className={`text-[22px] font-semibold ${isPremium ? 'text-white' : ''}`}>{title}</h3>
      </div>

      <div className="p-3">
        {tools.map((tool) => (
          <Link
            key={tool.slug}
            href={`/outil/${tool.slug}`}
            className={`flex items-center gap-4 p-4 rounded-lg transition-all duration-200 group/item ${
              isPremium ? 'hover:bg-white/[0.05]' : 'hover:bg-[#fafaf9]'
            }`}
          >
            <div
              className={`w-10 h-10 flex items-center justify-center rounded-lg ${
                isPremium ? 'bg-white/[0.08]' : 'bg-[#f5f5f0]'
              }`}
            >
              <tool.icon className={`w-5 h-5 ${isPremium ? 'text-white/70' : 'text-gray-500'}`} />
            </div>
            <div className="flex-1">
              <p className={`text-[14px] ${isPremium ? 'text-white/90' : 'text-gray-700'}`}>
                {tool.name}
              </p>
            </div>
            <ArrowRight
              className={`w-4 h-4 opacity-0 -translate-x-1 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all ${
                isPremium ? 'text-white/40' : 'text-gray-300'
              }`}
            />
          </Link>
        ))}
      </div>

      <div className="px-6 pb-6 pt-2">
        <Link
          href={isPremium ? '/pricing' : `/outil/${tools[0]?.slug ?? ''}`}
          className={`flex items-center justify-center gap-2 w-full py-3 rounded-lg text-[13px] transition-all duration-300 ${
            isPremium
              ? 'bg-white text-black hover:bg-white/90'
              : 'bg-[#111] text-white hover:bg-[#333]'
          }`}
        >
          {isPremium && <Lock className="w-3.5 h-3.5" />}
          {isPremium ? 'Débloquer Premium' : 'Accéder gratuitement'}
        </Link>
      </div>
    </div>
  );
}

export function PracticalTools() {
  const freePlanTools: Tool[] = [
    { name: "Simulateur d'Emprunt", slug: 'simulateur-emprunt', icon: Calculator },
    { name: 'Intérêt Simple', slug: 'interet-simple', icon: Percent },
  ];

  const premiumPlanTools: Tool[] = [
    { name: 'Simulateur Salaire', slug: 'simulateur-salaire', icon: DollarSign },
    { name: 'Indices Économiques', slug: 'indices-economiques', icon: BarChart3 },
    { name: 'Intérêt Composé', slug: 'interet-compose', icon: TrendingUp },
  ];

  return (
    <section id="outils" className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mb-14">
          <span className="text-[11px] tracking-[0.15em] uppercase text-gray-400 block mb-3">
            Outils financiers
          </span>
          <h2 className="text-3xl md:text-4xl mb-4">Calculez, simulez, anticipez</h2>
          <p className="text-gray-500 text-[15px] leading-relaxed">
            Des calculateurs et simulateurs professionnels conçus pour les investisseurs et
            professionnels au Niger et en Afrique.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          <PlanCard title="Plan Gratuit" badge="GRATUIT" tools={freePlanTools} />
          <PlanCard title="Plan Premium" badge="PREMIUM" tools={premiumPlanTools} isPremium />
        </div>

        <div className="text-center mt-10">
          <p className="text-[12px] text-gray-400">
            Tous les outils sont optimisés pour le contexte économique africain
          </p>
        </div>
      </div>
    </section>
  );
}

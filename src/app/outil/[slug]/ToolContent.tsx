'use client';

import Link from 'next/link';
import { ArrowLeft, Calculator, Percent, DollarSign, BarChart3, TrendingUp, Lock } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { SimulateurEmprunt } from '@/components/tools/SimulateurEmprunt';
import { InteretSimple } from '@/components/tools/InteretSimple';
import { SimulateurSalaire } from '@/components/tools/SimulateurSalaire';
import { IndicesEconomiques } from '@/components/tools/IndicesEconomiques';
import { InteretCompose } from '@/components/tools/InteretCompose';

interface ToolContentProps {
  slug: string;
  title: string;
  description: string;
  isPremium: boolean;
}

const toolComponents: Record<string, React.ComponentType> = {
  'simulateur-emprunt': SimulateurEmprunt,
  'interet-simple': InteretSimple,
  'simulateur-salaire': SimulateurSalaire,
  'indices-economiques': IndicesEconomiques,
  'interet-compose': InteretCompose,
};

const toolIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'simulateur-emprunt': Calculator,
  'interet-simple': Percent,
  'simulateur-salaire': DollarSign,
  'indices-economiques': BarChart3,
  'interet-compose': TrendingUp,
};

export function ToolContent({ slug, title, description, isPremium }: ToolContentProps) {
  const { isSignedIn, userRole } = useAuth();
  const ToolComponent = toolComponents[slug];
  const Icon = toolIcons[slug] || Calculator;
  const canAccess = !isPremium || (isSignedIn && (userRole === 'standard' || userRole === 'pro' || userRole === 'admin'));
  const needsGate = !canAccess;

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <section className="bg-[#111] text-white py-10 md:py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/#outils" className="inline-flex items-center gap-1.5 text-[13px] text-white/40 hover:text-white/70 transition-colors mb-6"><ArrowLeft className="w-4 h-4" />Retour aux outils</Link>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/[0.08] rounded-xl flex items-center justify-center"><Icon className="w-6 h-6 text-white/70" /></div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{title}</h1>
                {isPremium && <span className="text-[10px] bg-white/10 text-white/60 px-2.5 py-1 rounded-full tracking-wider uppercase">Premium</span>}
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
                {isSignedIn
                  ? 'Débloquez les outils premium avec l\'abonnement Standard ou Pro.'
                  : 'Connectez-vous et abonnez-vous pour accéder à cet outil professionnel.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {!isSignedIn && (
                  <Link href="/connexion" className="bg-[#111] text-white px-8 py-3 rounded-lg hover:bg-[#333] transition-colors text-[14px]">Se connecter</Link>
                )}
                <Link href="/pricing" className="bg-[#111] text-white px-8 py-3 rounded-lg hover:bg-[#333] transition-colors text-[14px]">Voir les abonnements</Link>
              </div>
            </div>
          ) : ToolComponent ? <ToolComponent /> : null}
        </div>
      </section>
    </div>
  );
}

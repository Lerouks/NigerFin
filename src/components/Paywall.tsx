'use client';

import Link from 'next/link';
import { Lock, Check, Star, ArrowRight, X } from 'lucide-react';
import { TIERS } from '@/config/pricing';

type PaywallReason = 'login_required' | 'paywall_reader' | 'paywall_pro' | 'visitor_limit';

interface PaywallProps {
  reason: PaywallReason;
  onClose?: () => void;
  premiumArticlesUsed?: number;
  premiumArticlesLimit?: number;
  inline?: boolean;
}

export function Paywall({
  reason,
  onClose,
  premiumArticlesUsed = 0,
  premiumArticlesLimit = 3,
  inline = false,
}: PaywallProps) {
  const content = getPaywallContent(reason, premiumArticlesUsed, premiumArticlesLimit);

  if (inline) {
    return (
      <div className="bg-gradient-to-t from-white via-white/95 to-transparent pt-20 pb-8 -mt-20 relative">
        <div className="bg-white border border-black/[0.06] rounded-xl p-8 text-center max-w-lg mx-auto shadow-lg">
          <InnerContent content={content} reason={reason} />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full p-8 relative shadow-2xl">
        {onClose && (
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
        <InnerContent content={content} reason={reason} />
      </div>
    </div>
  );
}

function InnerContent({ content, reason }: { content: PaywallContentData; reason: PaywallReason }) {
  return (
    <>
      <div className="flex justify-center mb-4">
        <div className="w-14 h-14 bg-[#f5f5f0] rounded-full flex items-center justify-center">
          <Lock className="w-6 h-6 text-gray-500" />
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-2">{content.title}</h2>
      <p className="text-gray-600 mb-6">{content.message}</p>

      {content.showComparison && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-left">
          <PlanCard
            name="Standard"
            price={TIERS.standard.plans.monthly.amount.toLocaleString('fr-FR')}
            badge="POPULAIRE"
            features={TIERS.standard.features.slice(0, 5)}
            isPopular
          />
          <PlanCard
            name="Pro"
            price={TIERS.pro.plans.monthly.amount.toLocaleString('fr-FR')}
            badge="PREMIUM"
            features={TIERS.pro.features.slice(0, 5)}
          />
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {reason === 'login_required' || reason === 'visitor_limit' ? (
          <>
            <Link
              href="/connexion"
              className="bg-[#111] text-white px-8 py-3 rounded-lg hover:bg-[#333] transition-colors text-[14px] text-center"
            >
              Se connecter
            </Link>
            <Link
              href="/inscription"
              className="border border-black/[0.1] px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors text-[14px] text-center"
            >
              Créer un compte gratuit
            </Link>
          </>
        ) : (
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 bg-[#111] text-white px-8 py-3 rounded-lg hover:bg-[#333] transition-colors text-[14px]"
          >
            Voir les abonnements
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </>
  );
}

function PlanCard({
  name,
  price,
  badge,
  features,
  isPopular,
}: {
  name: string;
  price: string;
  badge: string;
  features: string[];
  isPopular?: boolean;
}) {
  return (
    <div className={`rounded-lg p-5 border ${isPopular ? 'bg-[#111] text-white border-white/10' : 'bg-white border-black/[0.06]'}`}>
      <div className="flex items-center gap-2 mb-2">
        {isPopular && <Star className="w-4 h-4" style={{ color: '#d4a843', fill: '#d4a843' }} />}
        <span className={`text-[10px] tracking-[0.15em] uppercase ${isPopular ? 'text-white/40' : 'text-gray-400'}`}>
          {badge}
        </span>
      </div>
      <h3 className="text-lg font-bold mb-1">{name}</h3>
      <p className={`text-sm mb-3 ${isPopular ? 'text-white/60' : 'text-gray-500'}`}>{price} FCFA/mois</p>
      <ul className="space-y-1.5">
        {features.map((f) => (
          <li key={f} className={`flex items-center gap-2 text-xs ${isPopular ? 'text-white/70' : 'text-gray-600'}`}>
            <Check className={`w-3.5 h-3.5 flex-shrink-0 ${isPopular ? 'text-emerald-400' : 'text-emerald-600'}`} />
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}

interface PaywallContentData {
  title: string;
  message: string;
  showComparison: boolean;
}

function getPaywallContent(
  reason: PaywallReason,
  used: number,
  limit: number
): PaywallContentData {
  switch (reason) {
    case 'visitor_limit':
      return {
        title: 'Créez un compte pour continuer',
        message: `Vous avez lu vos ${limit} articles gratuits. Créez un compte gratuit pour continuer à lire.`,
        showComparison: false,
      };
    case 'login_required':
      return {
        title: 'Contenu réservé aux abonnés',
        message: 'Connectez-vous ou créez un compte pour accéder à ce contenu premium.',
        showComparison: false,
      };
    case 'paywall_reader':
      return {
        title: 'Limite atteinte',
        message: `Vous avez lu ${used}/${limit} articles premium ce mois-ci. Passez à Standard pour un accès illimité.`,
        showComparison: true,
      };
    case 'paywall_pro':
      return {
        title: 'Contenu exclusif Pro',
        message: 'Ce contenu est réservé aux abonnés Pro. Passez au plan Pro pour un accès complet.',
        showComparison: true,
      };
  }
}

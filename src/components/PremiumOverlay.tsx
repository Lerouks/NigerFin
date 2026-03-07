'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Lock, X, Check, Star, Crown } from 'lucide-react';
import { BILLING_OPTIONS, PREMIUM_TIER, CURRENCY } from '@/config/pricing';

type OverlayReason = 'login_required' | 'paywall_reader' | 'visitor_limit';

interface PremiumOverlayProps {
  reason: OverlayReason;
  premiumArticlesUsed?: number;
  premiumArticlesLimit?: number;
  onClose?: () => void;
}

export function PremiumOverlay({
  reason,
  premiumArticlesUsed = 0,
  premiumArticlesLimit = 3,
  onClose,
}: PremiumOverlayProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Lock body scroll
    document.body.style.overflow = 'hidden';
    // Trigger entrance animation
    const raf = requestAnimationFrame(() => setIsVisible(true));
    return () => {
      document.body.style.overflow = '';
      cancelAnimationFrame(raf);
    };
  }, []);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      document.body.style.overflow = '';
      onClose?.();
    }, 250);
  }, [onClose]);

  const content = getOverlayContent(reason, premiumArticlesUsed, premiumArticlesLimit);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ease-out ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ backdropFilter: isVisible ? 'blur(8px)' : 'blur(0px)' }}
    >
      {/* Dark overlay background */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity duration-300"
        onClick={onClose ? handleClose : undefined}
      />

      {/* Modal card */}
      <div
        className={`relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ease-out ${
          isVisible ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-4 opacity-0'
        }`}
      >
        {/* Close button */}
        {onClose && (
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        )}

        {/* Top accent bar */}
        <div className="h-1 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600" />

        <div className="p-8 md:p-10">
          {/* Icon */}
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center">
              <Lock className="w-7 h-7 text-amber-600" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl md:text-[26px] font-bold text-center text-gray-900 mb-2">
            {content.title}
          </h2>

          {/* Message */}
          <p className="text-center text-gray-500 text-[15px] leading-relaxed mb-8 max-w-sm mx-auto">
            {content.message}
          </p>

          {/* Pricing cards */}
          <div className="space-y-2.5 mb-8">
            {BILLING_OPTIONS.map((opt, i) => (
              <div
                key={opt.cycle}
                className={`flex items-center justify-between px-4 py-3.5 rounded-xl border transition-colors ${
                  i === 0
                    ? 'border-amber-200 bg-amber-50/50'
                    : 'border-gray-100 bg-gray-50/50 hover:border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {i === 0 && <Crown className="w-4 h-4 text-amber-500" />}
                  <span className="text-sm font-medium text-gray-800">
                    {opt.durationLabel}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900">
                    {opt.price.toLocaleString('fr-FR')} {CURRENCY}
                  </span>
                  {opt.savings && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                      {opt.savings}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Features */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-3.5 h-3.5 text-amber-500" style={{ fill: 'currentColor' }} />
              <span className="text-[11px] tracking-[0.12em] uppercase text-gray-400 font-medium">
                Avantages Premium
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PREMIUM_TIER.features.map((feature) => (
                <div key={feature} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span className="text-[13px] text-gray-600">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Counter for reader limit */}
          {reason === 'paywall_reader' && (
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 text-red-600 text-[13px] font-medium">
                <span>{premiumArticlesUsed}/{premiumArticlesLimit} articles premium lus ce mois</span>
              </div>
            </div>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-col gap-3">
            <Link
              href="/pricing"
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-[#111] text-white rounded-xl text-[15px] font-medium hover:bg-[#222] active:bg-[#333] transition-colors"
            >
              S&apos;abonner maintenant
            </Link>
            <Link
              href="/connexion"
              className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 text-gray-700 rounded-xl text-[14px] font-medium hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function getOverlayContent(
  reason: OverlayReason,
  used: number,
  limit: number
): { title: string; message: string } {
  switch (reason) {
    case 'login_required':
      return {
        title: 'Accès réservé aux abonnés',
        message:
          'Cet article fait partie du contenu premium. Abonnez-vous pour accéder aux analyses complètes et aux outils avancés.',
      };
    case 'paywall_reader':
      return {
        title: 'Limite atteinte',
        message: `Vous avez lu ${used}/${limit} articles premium ce mois-ci. Passez à l'abonnement Premium pour un accès illimité à tout notre contenu.`,
      };
    case 'visitor_limit':
      return {
        title: 'Créez un compte pour continuer',
        message: `Vous avez atteint la limite de ${limit} articles gratuits. Créez un compte ou abonnez-vous pour continuer à lire.`,
      };
  }
}

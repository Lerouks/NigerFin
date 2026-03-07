'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { BILLING_OPTIONS, CURRENCY } from '@/config/pricing';

type PaywallReason = 'login_required' | 'paywall_reader' | 'visitor_limit';

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
    if (!inline) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [inline]);

  const content = getPaywallContent(reason, premiumArticlesUsed, premiumArticlesLimit);

  // Inline mode: gradient fade with card below (used inside article body)
  if (inline) {
    return (
      <div className="bg-gradient-to-t from-white via-white/95 to-transparent pt-20 pb-8 -mt-20 relative">
        <div className="bg-white border border-black/[0.06] rounded-2xl p-8 sm:p-10 max-w-lg mx-auto shadow-lg">
          <OverlayCard content={content} reason={reason} onClose={onClose} />
        </div>
      </div>
    );
  }

  // Modal mode: full-screen overlay like RFI
  return (
    <div
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center transition-opacity duration-300 ${
        mounted ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Dimmed background */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Card */}
      <div
        className={`relative bg-white w-full sm:max-w-xl sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden transition-all duration-300 ease-out ${
          mounted
            ? 'translate-y-0 opacity-100'
            : 'translate-y-8 opacity-0'
        }`}
      >
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 z-10 text-gray-400 hover:text-gray-900 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-6 h-6" />
          </button>
        )}

        <div className="p-8 sm:p-10">
          <OverlayCard content={content} reason={reason} onClose={onClose} />
        </div>
      </div>
    </div>
  );
}

// ─── The shared card content, styled like RFI ───────────────────────────────

interface OverlayCardProps {
  content: PaywallContentData;
  reason: PaywallReason;
  onClose?: () => void;
}

function OverlayCard({ content, reason }: OverlayCardProps) {
  return (
    <div className="text-center">
      {/* Title — big, bold, editorial */}
      <h2 className="text-[26px] sm:text-[30px] font-extrabold leading-tight text-gray-900 mb-3">
        {content.title}
      </h2>

      {/* Subtitle */}
      <p className="text-[15px] sm:text-base text-gray-500 leading-relaxed mb-8 max-w-md mx-auto">
        {content.message}
      </p>

      {/* Pricing — simple, clean lines */}
      {(reason === 'paywall_reader' || reason === 'login_required') && (
        <div className="mb-8 space-y-3 max-w-xs mx-auto">
          {BILLING_OPTIONS.map((opt) => (
            <div
              key={opt.cycle}
              className="flex items-center justify-between text-[15px]"
            >
              <span className="text-gray-600">{opt.durationLabel}</span>
              <span className="font-bold text-gray-900">
                {opt.price.toLocaleString('fr-FR')} {CURRENCY}
                {opt.savings && (
                  <span className="ml-2 text-[11px] font-medium text-emerald-600">
                    {opt.savings}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* CTA buttons */}
      <div className="flex flex-col gap-3">
        <Link
          href="/pricing"
          className="w-full py-3.5 bg-[#111] text-white rounded-lg text-[15px] font-semibold hover:bg-[#222] transition-colors text-center"
        >
          S&apos;abonner maintenant
        </Link>
        <Link
          href="/connexion"
          className="w-full py-3 border border-gray-200 text-gray-700 rounded-lg text-[14px] font-medium hover:bg-gray-50 transition-colors text-center"
        >
          Se connecter
        </Link>
      </div>
    </div>
  );
}

// ─── Content per reason ─────────────────────────────────────────────────────

interface PaywallContentData {
  title: string;
  message: string;
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
        message: `Vous avez lu vos ${limit} articles gratuits ce mois-ci. Créez un compte gratuit pour continuer à lire.`,
      };
    case 'login_required':
      return {
        title: 'Contenu réservé aux abonnés',
        message: 'Cet article fait partie du contenu premium. Abonnez-vous pour accéder aux analyses complètes et aux outils avancés.',
      };
    case 'paywall_reader':
      return {
        title: 'Accès réservé aux abonnés',
        message: `Vous avez lu ${used}/${limit} articles premium ce mois-ci. Abonnez-vous pour un accès illimité à tout notre contenu.`,
      };
  }
}

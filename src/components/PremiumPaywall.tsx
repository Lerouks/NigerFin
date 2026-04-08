'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { PREMIUM_MONTHLY_PRICE, CURRENCY } from '@/config/pricing';

interface PremiumPaywallProps {
  articleTitle?: string;
}

/**
 * Inline paywall block for premium articles.
 * Replaces the old PremiumOverlay popup with a clean, Bloomberg-inspired
 * in-article wall: gradient fade on text → slogan → mockup → CTA.
 *
 * Mounted inside ArticleContent when access is denied.
 */
export function PremiumPaywall({ articleTitle }: PremiumPaywallProps) {
  const { isSignedIn } = useAuth();

  return (
    <div className="relative">
      {/* Gradient fade over truncated text */}
      <div className="absolute -top-32 inset-x-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none" />

      {/* Paywall content */}
      <div className="flex flex-col items-center text-center pt-8 pb-12 px-4">
        {/* Slogan */}
        <p className="text-[11px] sm:text-[13px] font-bold tracking-[0.25em] uppercase text-[#111] mb-8">
          La connaissance, votre meilleur capital
        </p>

        {/* Mockup phone */}
        <div className="relative w-48 sm:w-56 md:w-64 mb-8">
          <Image
            src="/images/mockup-phone.png"
            alt="NFI Report sur mobile"
            width={800}
            height={1000}
            className="w-full h-auto"
            priority={false}
          />
        </div>

        {/* Article title preview */}
        {articleTitle && (
          <p className="text-[14px] text-gray-400 mb-2 max-w-sm line-clamp-2">
            &laquo; {articleTitle} &raquo;
          </p>
        )}

        {/* Message */}
        <p className="text-[15px] sm:text-[17px] text-gray-600 mb-6 max-w-md leading-relaxed">
          {isSignedIn
            ? 'Passez en Premium pour accéder à l\'intégralité de nos analyses et contenus exclusifs.'
            : 'Connectez-vous ou abonnez-vous pour lire cet article en intégralité.'}
        </p>

        {/* Primary CTA */}
        <Link
          href={isSignedIn ? '/pricing' : '/pricing'}
          className="inline-flex items-center gap-2 bg-[#111] text-white px-8 py-3.5 rounded-lg text-[15px] font-semibold hover:bg-black active:scale-[0.98] transition-all"
        >
          {isSignedIn
            ? `S'abonner — ${PREMIUM_MONTHLY_PRICE.toLocaleString('fr-FR')} ${CURRENCY}/mois`
            : `S'abonner — ${PREMIUM_MONTHLY_PRICE.toLocaleString('fr-FR')} ${CURRENCY}/mois`}
        </Link>

        {/* Secondary links */}
        <div className="flex items-center gap-4 mt-4 text-[13px]">
          {!isSignedIn && (
            <>
              <Link
                href="/connexion"
                className="text-gray-500 hover:text-[#111] font-medium transition-colors"
              >
                Déjà abonné ? Se connecter
              </Link>
            </>
          )}
          {isSignedIn && (
            <Link
              href="/compte"
              className="text-gray-500 hover:text-[#111] font-medium transition-colors"
            >
              Gérer mon abonnement
            </Link>
          )}
        </div>

        {/* Subtle features */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 mt-8 text-[11px] text-gray-400">
          <span>Analyses complètes</span>
          <span>·</span>
          <span>Outils premium</span>
          <span>·</span>
          <span>Newsletters exclusives</span>
        </div>
      </div>
    </div>
  );
}

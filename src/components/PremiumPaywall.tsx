'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { DEFAULT_READER_PREMIUM_LIMIT } from '@/lib/access-control';
import { PREMIUM_MONTHLY_PRICE, CURRENCY } from '@/config/pricing';

interface PremiumPaywallProps {
  articleTitle?: string;
  /** Articles Premium offerts chaque mois par un compte gratuit. */
  articlesOfferts?: number;
}

/**
 * Inline paywall block for premium articles.
 * Replaces the old PremiumOverlay popup with a clean, Bloomberg-inspired
 * in-article wall: gradient fade on text → slogan → mockup → CTA.
 *
 * Mounted inside ArticleContent when access is denied.
 *
 * Au visiteur sans compte, le mur propose aussi le compte gratuit, qui ouvre
 * quelques articles Premium par mois (décision de Raouf, 27/11/2026) : c'est
 * l'étape qui fait d'un visiteur un lecteur connu, puis un abonné. Après
 * l'inscription ou la connexion, il revient sur cet article.
 */
export function PremiumPaywall({ articleTitle, articlesOfferts = DEFAULT_READER_PREMIUM_LIMIT }: PremiumPaywallProps) {
  const { isSignedIn } = useAuth();
  const retour = encodeURIComponent(usePathname() ?? '/');

  return (
    <div className="relative">
      {/* Gradient fade over truncated text */}
      <div className="absolute -top-32 inset-x-0 h-32 bg-linear-to-t from-white to-transparent pointer-events-none" />

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
          <p className="text-[14px] text-gray-500 mb-2 max-w-sm line-clamp-2">
            &laquo; {articleTitle} &raquo;
          </p>
        )}

        {/* Message */}
        <p className="text-[15px] sm:text-[17px] text-gray-600 mb-6 max-w-md leading-relaxed text-balance">
          {isSignedIn
            ? 'Passez en Premium pour accéder à l\'intégralité de nos analyses et contenus exclusifs.'
            : <>Créez un compte gratuit pour lire {articlesOfferts}{'\u00a0'}articles Premium par mois, ou abonnez{'\u2011'}vous pour <span className="whitespace-nowrap">tout lire.</span></>}
        </p>

        {/* Primary CTA */}
        <Link
          href="/pricing"
          className="inline-flex w-full max-w-sm items-center justify-center gap-2 bg-[#111] text-white px-5 py-3.5 rounded-lg text-[15px] leading-snug text-center font-semibold hover:bg-black active:scale-[0.98] transition-all"
        >
          <span>
            S’abonner{'\u00a0'}: à partir de{' '}
            <span className="whitespace-nowrap">{`${PREMIUM_MONTHLY_PRICE.toLocaleString('fr-FR')}\u00a0${CURRENCY}/mois`}</span>
          </span>
        </Link>

        {/* Compte gratuit, pour le visiteur */}
        {!isSignedIn && (
          <Link
            href={`/inscription?redirect=${retour}`}
            className="inline-flex w-full max-w-sm items-center justify-center gap-2 border border-[#111] text-[#111] bg-white px-5 py-3 rounded-lg text-[15px] font-semibold hover:bg-[#f4f4f5] active:scale-[0.98] transition-all mt-3"
          >
            Créer un compte gratuit
          </Link>
        )}

        {/* Secondary links */}
        <div className="flex items-center gap-4 mt-4 text-[13px]">
          {!isSignedIn && (
            <>
              <Link
                href={`/connexion?next=${retour}`}
                className="text-gray-500 hover:text-[#111] font-medium transition-colors"
              >
                {'Déjà un compte\u00a0? Se connecter'}
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

        {/* Ce que donne l'abonnement : une ligne par avantage sur téléphone, une seule
            ligne avec des points de séparation dès qu'il y a la place (jamais un point
            resté seul en bout de ligne). */}
        <ul className="mt-8 flex flex-col items-center gap-1 sm:flex-row sm:justify-center sm:gap-0 text-[12px] text-gray-500">
          {['Analyses complètes', 'Simulateurs Premium', 'Newsletters exclusives'].map((avantage, i) => (
            <li key={avantage} className="flex items-center">
              {i > 0 && (
                <span className="hidden sm:inline px-3" aria-hidden="true">
                  ·
                </span>
              )}
              {avantage}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

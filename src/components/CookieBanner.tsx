'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Cookie, X } from 'lucide-react';
import { getConsent, setConsent } from '@/lib/consent';
import { initPostHog } from '@/lib/posthog';

/**
 * Bannière de consentement RGPD/CNIL.
 *
 * S'affiche après 1.5s si l'utilisateur n'a ni accepté ni refusé.
 * Tant qu'aucun choix n'est fait, les outils d'analyse et de suivi
 * d'erreurs restent désactivés.
 */
export function CookieBanner() {
  const [shouldShow, setShouldShow] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const consent = getConsent();
    if (consent === null) {
      // Show after 1.5s delay
      const timer = setTimeout(() => {
        setShouldShow(true);
        // Block scroll while banner is visible
        document.body.style.overflow = 'hidden';
        // Trigger animation on next frame
        requestAnimationFrame(() => setAnimate(true));
      }, 1500);
      return () => clearTimeout(timer);
    } else if (consent === 'accepted') {
      initPostHog();
    }
  }, []);

  const dismiss = () => {
    setAnimate(false);
    // Restore scroll immediately
    document.body.style.overflow = '';
    // Wait for exit animation then hide
    setTimeout(() => setShouldShow(false), 300);
  };

  const handleAccept = () => {
    setConsent('accepted');
    dismiss();
    initPostHog();
    if (typeof window !== 'undefined') {
      setTimeout(() => window.location.reload(), 400);
    }
  };

  const handleReject = () => {
    setConsent('rejected');
    dismiss();
  };

  if (!shouldShow) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Consentement aux cookies"
      className="fixed inset-0 z-[100] flex items-end justify-center"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 transition-opacity duration-400"
        style={{ opacity: animate ? 1 : 0 }}
      />

      {/* Banner */}
      <div
        className="relative w-full sm:max-w-4xl sm:mx-4 sm:mb-4 bg-white sm:rounded-2xl shadow-2xl border-t sm:border border-black/[0.08] p-5 sm:p-6 transition-all duration-400 ease-out"
        style={{
          transform: animate ? 'translateY(0)' : 'translateY(100%)',
          opacity: animate ? 1 : 0,
        }}
      >
        <div className="flex items-start gap-4">
          <div className="hidden sm:flex w-10 h-10 rounded-xl bg-[#fafaf9] items-center justify-center flex-shrink-0">
            <Cookie className="w-5 h-5 text-gold" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[15px] font-semibold text-gray-900 mb-1">
              Nous respectons votre vie privée
            </h2>
            <p className="text-[13px] text-gray-600 leading-relaxed">
              NFI Report utilise des cookies de mesure d&rsquo;audience et de suivi
              d&rsquo;erreurs techniques pour améliorer votre expérience. Ces outils sont
              désactivés tant que vous n&rsquo;avez pas donné votre accord. Les cookies
              strictement nécessaires au fonctionnement du site (authentification)
              restent actifs. Pour en savoir plus, consultez notre{' '}
              <Link href="/cookies" className="underline hover:text-gray-900">
                politique cookies
              </Link>{' '}
              et notre{' '}
              <Link href="/confidentialite" className="underline hover:text-gray-900">
                politique de confidentialité
              </Link>
              .
            </p>
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleAccept}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-[#111] text-white text-[13px] font-medium hover:bg-black transition-colors"
              >
                Accepter et continuer
              </button>
              <button
                type="button"
                onClick={handleReject}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-black/[0.1] text-gray-700 text-[13px] font-medium hover:bg-gray-50 transition-colors"
              >
                Refuser
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={handleReject}
            aria-label="Fermer et refuser les cookies non essentiels"
            className="flex-shrink-0 p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

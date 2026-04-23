'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Cookie, X } from 'lucide-react';
import { getConsent, setConsent } from '@/lib/consent';
import { initPostHog } from '@/lib/posthog';

/**
 * Bannière de consentement RGPD/CNIL.
 *
 * Toast discret en bas à droite (mobile : pleine largeur en bas).
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
      const timer = setTimeout(() => {
        setShouldShow(true);
        requestAnimationFrame(() => setAnimate(true));
      }, 1500);
      return () => clearTimeout(timer);
    } else if (consent === 'accepted') {
      initPostHog();
    }
  }, []);

  const dismiss = () => {
    setAnimate(false);
    setTimeout(() => setShouldShow(false), 300);
  };

  const handleAccept = () => {
    setConsent('accepted');
    dismiss();
    initPostHog();
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
      className="fixed z-[100] inset-x-0 bottom-0 sm:inset-x-auto sm:bottom-4 sm:right-4 sm:max-w-sm pointer-events-none"
    >
      <div
        className="pointer-events-auto bg-white border-t sm:border border-black/[0.08] sm:rounded-xl shadow-2xl p-4 sm:p-5 transition-all duration-300 ease-out"
        style={{
          transform: animate ? 'translateY(0)' : 'translateY(20px)',
          opacity: animate ? 1 : 0,
        }}
      >
        <div className="flex items-start gap-3">
          <div className="hidden sm:flex w-8 h-8 rounded-lg bg-[#fafaf9] items-center justify-center flex-shrink-0">
            <Cookie className="w-4 h-4 text-gold" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[14px] font-semibold text-gray-900 mb-1">
              Cookies
            </h2>
            <p className="text-[12px] text-gray-600 leading-relaxed mb-3">
              On utilise des cookies pour mesurer l&rsquo;audience.{' '}
              <Link href="/cookies" className="underline hover:text-gray-900">
                En savoir plus
              </Link>
              .
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAccept}
                className="inline-flex items-center justify-center min-h-[36px] px-3 py-1.5 rounded-md bg-[#111] text-white text-[12px] font-medium hover:bg-black transition-colors"
              >
                Accepter
              </button>
              <button
                type="button"
                onClick={handleReject}
                className="inline-flex items-center justify-center min-h-[36px] px-3 py-1.5 rounded-md border border-black/[0.1] text-gray-700 text-[12px] font-medium hover:bg-gray-50 transition-colors"
              >
                Refuser
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={handleReject}
            aria-label="Fermer et refuser les cookies non essentiels"
            className="flex-shrink-0 inline-flex items-center justify-center w-7 h-7 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

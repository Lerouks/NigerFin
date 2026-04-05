'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Cookie, X } from 'lucide-react';
import { getConsent, setConsent } from '@/lib/consent';
import { initPostHog } from '@/lib/posthog';

/**
 * Bannière de consentement RGPD/CNIL.
 *
 * S'affiche tant que l'utilisateur n'a ni accepté ni refusé les cookies
 * de mesure d'audience et de suivi. Tant qu'aucun choix n'est fait,
 * PostHog et Sentry restent désactivés (cf. src/lib/posthog.ts et
 * sentry.client.config.ts).
 */
export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Affiche la bannière uniquement si aucun choix n'a été fait.
    const consent = getConsent();
    if (consent === null) {
      setVisible(true);
    } else if (consent === 'accepted') {
      // Si l'utilisateur avait déjà accepté, on (ré)initialise les trackers.
      initPostHog();
    }
  }, []);

  const handleAccept = () => {
    setConsent('accepted');
    setVisible(false);
    initPostHog();
    // Sentry est initialisé au chargement de la page. On force un rechargement
    // léger pour que sentry.client.config.ts s'exécute avec consent = true.
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const handleReject = () => {
    setConsent('rejected');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Consentement aux cookies"
      className="fixed inset-x-0 bottom-0 z-[100] p-4 sm:p-6"
    >
      <div className="mx-auto max-w-4xl bg-white border border-black/[0.08] rounded-2xl shadow-2xl p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="hidden sm:flex w-10 h-10 rounded-xl bg-[#fafaf9] items-center justify-center flex-shrink-0">
            <Cookie className="w-5 h-5 text-gold" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[15px] font-semibold text-gray-900 mb-1">
              Nous respectons votre vie privée
            </h2>
            <p className="text-[13px] text-gray-600 leading-relaxed">
              NFI Report utilise des cookies de mesure d&rsquo;audience (PostHog) et de suivi
              d&rsquo;erreurs (Sentry) pour améliorer votre expérience. Ces outils sont
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

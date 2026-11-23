'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import localFont from 'next/font/local';
import { estNavigateurIntegre } from '@/lib/navigateur-integre';

// Google Sans Medium, la police que Google impose pour son bouton (licence OFL),
// en sous-ensemble latin hébergé chez nous : rien n'est demandé à Google avant le clic.
const googleSans = localFont({
  src: '../../fonts/GoogleSans-Medium-latin.woff2',
  weight: '500',
  display: 'swap',
  preload: false,
  fallback: ['Arial', 'sans-serif'],
});

const ContexteGoogle = createContext(false);

/** Posé par les layouts de connexion et d'inscription (voir FournisseurGoogle). */
export function GoogleDisponible({ valeur, children }: { valeur: boolean; children: React.ReactNode }) {
  return <ContexteGoogle.Provider value={valeur}>{children}</ContexteGoogle.Provider>;
}

export function useGoogleDisponible(): boolean {
  return useContext(ContexteGoogle);
}

/**
 * Bouton « Continuer avec Google », dessiné selon les règles de Google : fond
 * blanc, contour #747775, texte #1F1F1F en Google Sans Medium, G en couleurs.
 * Un lien et non un bouton : la connexion part par une simple navigation.
 */
export function BoutonGoogle({ suite }: { suite?: string | null }) {
  const [navigateurIntegre, setNavigateurIntegre] = useState(false);
  const [enCours, setEnCours] = useState(false);

  // Retour arrière depuis Google : la page revient du cache, le bouton doit redevenir actif.
  useEffect(() => {
    const reactiver = (e: PageTransitionEvent) => {
      if (e.persisted) setEnCours(false);
    };
    window.addEventListener('pageshow', reactiver);
    return () => window.removeEventListener('pageshow', reactiver);
  }, []);

  const href = suite ? `/api/auth/google?next=${encodeURIComponent(suite)}` : '/api/auth/google';

  return (
    <div>
      <a
        href={href}
        onClick={(e) => {
          if (estNavigateurIntegre(navigator.userAgent)) {
            e.preventDefault();
            setNavigateurIntegre(true);
            return;
          }
          if (enCours) {
            e.preventDefault();
            return;
          }
          setEnCours(true);
        }}
        aria-disabled={enCours || undefined}
        className={`${googleSans.className} flex h-[52px] w-full items-center justify-center gap-2.5 rounded-xl border border-[#747775] bg-white px-3 text-[15px] font-medium tracking-[0.1px] text-[#1f1f1f] transition-colors duration-200 hover:bg-[#f6f7f8] aria-disabled:opacity-70`}
      >
        <LogoGoogle className="h-5 w-5 shrink-0" />
        <span>Continuer avec Google</span>
      </a>
      {navigateurIntegre && (
        <p role="status" className="mt-3 rounded-xl bg-[#f4f4f5] px-4 py-3 text-[13px] leading-relaxed text-gray-600">
          Google refuse la connexion dans le navigateur de Facebook, d’Instagram ou de TikTok. Ouvrez cette page dans Safari ou Chrome pour continuer avec&nbsp;Google.
        </p>
      )}
    </div>
  );
}

/** Le « G » de Google, dans ses couleurs d'origine (imposées par Google). */
function LogoGoogle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className={className}>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

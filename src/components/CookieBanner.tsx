'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import posthog from 'posthog-js';
import {
  getConsent,
  setConsent,
  retraitDAccord,
  OUVRIR_CHOIX_COOKIES,
  type ConsentValue,
} from '@/lib/consent';
import { initPostHog } from '@/lib/posthog';

/** Durée de l'arrivée et du départ du bandeau, en millisecondes. */
const DUREE_ANIMATION = 300;

/**
 * Le contenu du bandeau : une phrase et deux boutons de même taille, au même
 * niveau, pour que refuser soit aussi simple qu'accepter. Ni croix ni icône.
 * Le mot « cookies » mène à la politique des cookies.
 */
export function ContenuBandeauCookies({ onChoix }: { onChoix: (choix: ConsentValue) => void }) {
  const bouton =
    'inline-flex h-11 items-center justify-center rounded-lg border px-5 text-[15px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:min-w-[124px]';
  return (
    <div className="mx-auto max-w-7xl px-4 pt-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] sm:px-6 md:flex md:items-center md:justify-between md:gap-8 lg:px-8">
      {/* Deux groupes soudés : sur un écran étroit, la phrase se coupe en deux
          moitiés égales au lieu de laisser « l’audience. » seul sur sa ligne. */}
      <p className="text-[15px] leading-normal text-gray-300">
        <span className="whitespace-nowrap">
          On utilise des{' '}
          <Link
            href="/cookies"
            aria-label="En savoir plus sur les cookies"
            className="text-white underline decoration-white/45 underline-offset-[3px] transition-colors hover:decoration-white"
          >
            cookies
          </Link>
        </span>{' '}
        <span className="whitespace-nowrap">pour mesurer l&rsquo;audience.</span>
      </p>
      <div className="mt-3 grid shrink-0 grid-cols-2 gap-2.5 md:mt-0 md:flex">
        <button
          type="button"
          onClick={() => onChoix('rejected')}
          className={`${bouton} border-white/30 text-white hover:bg-white/10`}
        >
          Refuser
        </button>
        <button
          type="button"
          onClick={() => onChoix('accepted')}
          className={`${bouton} border-white bg-white text-[#0b0b0c] hover:border-gray-200 hover:bg-gray-200`}
        >
          Accepter
        </button>
      </div>
    </div>
  );
}

/**
 * Bandeau de consentement RGPD/CNIL, en version « bandeau » choisie par Raouf le
 * 25/11/2026 : une bande noire en bas de l'écran, comme le pied de page du site
 * et les mails Cadre.
 *
 * Il arrive 1,5 seconde après la page tant que le lecteur n'a pas choisi, et le
 * lien « Choix des cookies » du pied de page le rouvre à tout moment, pour
 * retirer son accord aussi simplement qu'on l'a donné. Tant qu'aucun choix n'est
 * fait, la mesure d'audience (PostHog) et le suivi des erreurs (Sentry) restent
 * éteints.
 */
export function CookieBanner() {
  const pathname = usePathname() ?? '/';
  const isAdminSurface =
    pathname.startsWith('/admin') || pathname.startsWith('/dev-cockpit-preview');
  const [shouldShow, setShouldShow] = useState(false);
  const [animate, setAnimate] = useState(false);
  const bandeau = useRef<HTMLElement>(null);

  const ouvrir = useCallback(() => {
    setShouldShow(true);
    // Deux images : le bandeau se pose d'abord sous l'écran, puis monte.
    requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)));
  }, []);

  const fermer = useCallback(() => {
    setAnimate(false);
    setTimeout(() => setShouldShow(false), DUREE_ANIMATION);
  }, []);

  useEffect(() => {
    if (isAdminSurface) return;
    const consent = getConsent();
    if (consent === null) {
      const timer = setTimeout(ouvrir, 1500);
      return () => clearTimeout(timer);
    }
    if (consent === 'accepted') initPostHog();
  }, [isAdminSurface, ouvrir]);

  // Le lien « Choix des cookies » du pied de page rouvre le bandeau.
  useEffect(() => {
    if (isAdminSurface) return;
    window.addEventListener(OUVRIR_CHOIX_COOKIES, ouvrir);
    return () => window.removeEventListener(OUVRIR_CHOIX_COOKIES, ouvrir);
  }, [isAdminSurface, ouvrir]);

  // La page réserve en bas la hauteur exacte du bandeau (2 lignes sur un petit
  // téléphone, 1 sur ordinateur), pour qu'il ne cache jamais la fin de la page ;
  // les boutons flottants remontent d'autant (globals.css).
  useEffect(() => {
    const el = bandeau.current;
    if (!shouldShow || !el) return;
    const body = document.body;
    const appliquer = () =>
      body.style.setProperty('--hauteur-bandeau-cookies', `${el.offsetHeight}px`);
    appliquer();
    body.classList.add('cookie-banner-visible');
    const observateur = new ResizeObserver(appliquer);
    observateur.observe(el);
    return () => {
      observateur.disconnect();
      body.classList.remove('cookie-banner-visible');
      body.style.removeProperty('--hauteur-bandeau-cookies');
    };
  }, [shouldShow]);

  const choisir = useCallback(
    (choix: ConsentValue) => {
      const avant = getConsent();
      setConsent(choix);
      if (retraitDAccord(avant, choix)) {
        // PostHog s'arrête tout de suite ; la page se recharge pour que Sentry,
        // lancé au chargement seulement après accord, reparte éteint.
        if (posthog.__loaded) {
          posthog.opt_out_capturing();
          posthog.reset();
        }
        window.location.reload();
        return;
      }
      if (choix === 'accepted') initPostHog();
      fermer();
    },
    [fermer],
  );

  // Échap : un premier choix vaut refus (le plus protecteur) ; un bandeau rouvert
  // depuis le pied de page se referme simplement, sans changer le choix fait.
  // a11y : SC 2.1.2 No Keyboard Trap.
  useEffect(() => {
    if (!shouldShow) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (getConsent() === null) choisir('rejected');
      else fermer();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [shouldShow, choisir, fermer]);

  if (!shouldShow) return null;

  // Niveau 45 : au-dessus de la page et du bouton « remonter » (40), sous l'en-tête
  // (50) et sous toutes les fenêtres (recherche, filtres, compte, newsletter), qui
  // le recouvrent au lieu d'avoir le bas caché par lui.
  return (
    <aside
      ref={bandeau}
      aria-live="polite"
      aria-label="Consentement aux cookies"
      className="fixed inset-x-0 bottom-0 z-45 border-t border-white/14 bg-[#111] text-white transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none"
      style={{ transform: animate ? 'translateY(0)' : 'translateY(100%)' }}
    >
      <ContenuBandeauCookies onChoix={choisir} />
    </aside>
  );
}

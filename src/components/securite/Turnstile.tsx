'use client';

import { useEffect, useRef } from 'react';

/**
 * Turnstile, le contrôle anti-robots de Cloudflare (décision de Raouf,
 * 26/11/2026). Gratuit, il reste invisible pour presque tout le monde et ne
 * pose une question qu'en cas de doute.
 *
 * Il ne s'active que si la clé du site (NEXT_PUBLIC_TURNSTILE_SITE_KEY) existe :
 * sans elle, le composant ne dessine rien et les formulaires marchent comme
 * avant. Chaque jeton ne sert qu'une fois : après un envoi, le formulaire
 * redemande un jeton en changeant `tour`.
 */

const CLE_DU_SITE = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '';
const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

export const turnstileActif = CLE_DU_SITE.length > 0;

interface ApiTurnstile {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  reset: (id?: string) => void;
  remove: (id: string) => void;
}

declare global {
  interface Window {
    turnstile?: ApiTurnstile;
  }
}

let chargement: Promise<ApiTurnstile> | null = null;

function chargerTurnstile(): Promise<ApiTurnstile> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (chargement) return chargement;
  chargement = new Promise<ApiTurnstile>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT;
    script.async = true;
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('turnstile absent')));
    script.onerror = () => {
      chargement = null;
      reject(new Error('turnstile injoignable'));
    };
    document.head.appendChild(script);
  });
  return chargement;
}

export function Turnstile({ onJeton, tour = 0, action }: {
  /** Reçoit le jeton, ou null quand il expire ou qu'il faut en redemander un. */
  onJeton: (jeton: string | null) => void;
  /** Change après chaque envoi : le jeton déjà utilisé est remplacé. */
  tour?: number;
  /** Le nom du formulaire, visible dans les statistiques de Cloudflare. */
  action?: string;
}) {
  const conteneur = useRef<HTMLDivElement>(null);
  const idWidget = useRef<string | null>(null);
  const rappel = useRef(onJeton);

  useEffect(() => {
    rappel.current = onJeton;
  }, [onJeton]);

  useEffect(() => {
    if (!turnstileActif || !conteneur.current) return;
    let annule = false;
    chargerTurnstile()
      .then((api) => {
        if (annule || !conteneur.current || idWidget.current) return;
        idWidget.current = api.render(conteneur.current, {
          sitekey: CLE_DU_SITE,
          action,
          language: 'fr',
          appearance: 'interaction-only',
          size: 'flexible',
          callback: (jeton: string) => rappel.current(jeton),
          'expired-callback': () => rappel.current(null),
          'error-callback': () => rappel.current(null),
        });
      })
      .catch(() => rappel.current(null));
    return () => {
      annule = true;
      if (idWidget.current && window.turnstile) window.turnstile.remove(idWidget.current);
      idWidget.current = null;
    };
  }, [action]);

  useEffect(() => {
    if (!tour || !idWidget.current || !window.turnstile) return;
    rappel.current(null);
    window.turnstile.reset(idWidget.current);
  }, [tour]);

  if (!turnstileActif) return null;
  return <div ref={conteneur} className="min-h-0 [&:empty]:hidden" />;
}

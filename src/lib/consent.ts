/**
 * RGPD/CNIL cookie consent helpers.
 *
 * Trackers (PostHog analytics, Sentry session replay) must NOT run
 * until the user has explicitly accepted. Before acceptance, we only
 * load strictly necessary cookies (auth session).
 */

export type ConsentValue = 'accepted' | 'rejected';

const CONSENT_STORAGE_KEY = 'nfi_cookie_consent';
const CONSENT_EVENT = 'nfi:consent-changed';

export function getConsent(): ConsentValue | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    return v === 'accepted' || v === 'rejected' ? v : null;
  } catch {
    return null;
  }
}

export function setConsent(value: ConsentValue): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, value);
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
  } catch {
    // ignore: storage may be blocked
  }
}

export function hasAcceptedConsent(): boolean {
  return getConsent() === 'accepted';
}

/** Événement qui rouvre le bandeau des cookies (lien « Choix des cookies » du pied de page). */
export const OUVRIR_CHOIX_COOKIES = 'nfi:ouvrir-choix-cookies';

/** Rouvre le bandeau des cookies, pour changer son choix à tout moment. */
export function ouvrirChoixCookies(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(OUVRIR_CHOIX_COOKIES));
}

/**
 * Vrai quand le lecteur retire un accord déjà donné. Il faut alors recharger la
 * page : Sentry ne se lance qu'au chargement, et seulement après accord.
 */
export function retraitDAccord(avant: ConsentValue | null, apres: ConsentValue): boolean {
  return avant === 'accepted' && apres === 'rejected';
}

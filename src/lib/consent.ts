/**
 * RGPD/CNIL cookie consent helpers.
 *
 * Trackers (PostHog analytics, Sentry session replay) must NOT run
 * until the user has explicitly accepted. Before acceptance, we only
 * load strictly necessary cookies (auth session).
 */

export type ConsentValue = 'accepted' | 'rejected';

export const CONSENT_STORAGE_KEY = 'nfi_cookie_consent';
export const CONSENT_EVENT = 'nfi:consent-changed';

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

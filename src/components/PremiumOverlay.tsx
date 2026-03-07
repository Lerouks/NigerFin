'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X, Check } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getReaderPremiumLimit } from '@/lib/access-control';
import type { UserRole } from '@/types';

// ─── Types ───────────────────────────────────────────────────────────────────

type OverlayCase =
  | 'not_connected'
  | 'connected_has_articles'
  | 'connected_no_articles'
  | 'reader_has_articles'
  | 'reader_no_articles'
  | 'premium'
  | 'admin';

interface OverlayConfig {
  isBlocking: boolean;
  scrollTriggerPercent: number;
  title: string;
  message: string;
  benefits?: string[];
  ctaPrimary: { text: string; href: string };
  ctaSecondary?: { text: string; href: string };
  counterText?: string;
  showEmailField?: boolean;
}

interface PremiumOverlayProps {
  articleId?: string;
  articleTitle?: string;
  isPremium: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SESSION_ID_KEY = 'nfi_overlay_session';
const DISMISS_KEY = 'nfi_overlay_dismissed';

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sid = sessionStorage.getItem(SESSION_ID_KEY);
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem(SESSION_ID_KEY, sid);
  }
  return sid;
}

function wasDismissedRecently(): boolean {
  if (typeof window === 'undefined') return false;
  const ts = localStorage.getItem(DISMISS_KEY);
  if (!ts) return false;
  return Date.now() - parseInt(ts, 10) < 4 * 3600 * 1000;
}

function markDismissed(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  }
}

function trackOverlayEvent(
  eventType: string,
  data?: { articleId?: string; userId?: string; scrollDepth?: number; readTimeSeconds?: number; overlayCase?: string }
) {
  fetch('/api/paywall/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_type: eventType,
      article_id: data?.articleId || null,
      user_id: data?.userId || null,
      session_id: getSessionId(),
      scroll_depth: data?.scrollDepth || null,
      read_time_seconds: data?.readTimeSeconds || null,
      overlay_case: data?.overlayCase || null,
    }),
  }).catch(() => {});
}

// ─── Overlay case detection ──────────────────────────────────────────────────

function getOverlayCase(
  isSignedIn: boolean,
  userRole: UserRole | null,
  premiumArticlesUsed: number,
  isPremiumArticle: boolean,
  configuredLimit?: number
): OverlayCase {
  if (!isPremiumArticle) return 'premium';
  if (!isSignedIn) return 'not_connected';
  if (userRole === 'admin') return 'admin';
  if (userRole === 'premium') return 'premium';

  const limit = getReaderPremiumLimit(configuredLimit);

  if (userRole === 'reader') {
    return premiumArticlesUsed < limit ? 'reader_has_articles' : 'reader_no_articles';
  }

  return premiumArticlesUsed < limit ? 'connected_has_articles' : 'connected_no_articles';
}

// ─── Config per case ─────────────────────────────────────────────────────────

function getOverlayConfig(overlayCase: OverlayCase, remaining: number): OverlayConfig | null {
  switch (overlayCase) {
    case 'premium':
    case 'admin':
      return null;

    case 'not_connected':
      return {
        isBlocking: true,
        scrollTriggerPercent: 30,
        title: 'Contenu Premium',
        message: 'Authentifiez-vous pour acceder a l\'article complet',
        showEmailField: true,
        benefits: [
          'Acces aux contenus premium',
          'Interaction avec la communaute',
          'Alertes et notifications',
          'Personnalisation de l\'experience',
        ],
        ctaPrimary: { text: 'Continuer', href: '/connexion' },
        ctaSecondary: { text: 'Creer un compte', href: '/inscription' },
      };

    case 'connected_has_articles':
      return {
        isBlocking: false,
        scrollTriggerPercent: 40,
        title: 'Contenu Premium',
        message: 'Vous beneficiez de 3 articles premium gratuits chaque mois.',
        counterText: `Il vous reste ${remaining} article${remaining !== 1 ? 's' : ''}.`,
        ctaPrimary: { text: 'Continuer la lecture', href: '' },
        ctaSecondary: { text: 'Passer en Premium', href: '/pricing' },
      };

    case 'connected_no_articles':
      return {
        isBlocking: true,
        scrollTriggerPercent: 30,
        title: 'Contenu Premium',
        message: 'Vous avez utilise vos 3 articles premium gratuits ce mois-ci.',
        benefits: [
          'Acces illimite aux articles',
          'Analyses economiques approfondies',
          'Outils d\'analyse automatique',
          'Donnees marches en temps reel',
        ],
        ctaPrimary: { text: 'Passer en Premium', href: '/pricing' },
      };

    case 'reader_has_articles':
      return {
        isBlocking: false,
        scrollTriggerPercent: 40,
        title: 'Contenu Premium',
        message: 'Votre formule inclut 3 analyses premium par mois.',
        counterText: `Il vous reste ${remaining} article${remaining !== 1 ? 's' : ''}.`,
        ctaPrimary: { text: 'Continuer la lecture', href: '' },
        ctaSecondary: { text: 'Passer en Premium', href: '/pricing' },
      };

    case 'reader_no_articles':
      return {
        isBlocking: true,
        scrollTriggerPercent: 30,
        title: 'Contenu Premium',
        message: 'Limite mensuelle atteinte. Passez en Premium pour un acces illimite.',
        benefits: [
          'Acces total aux analyses',
          'Acces complet aux outils',
          'Contenu exclusif reserve aux membres Premium',
        ],
        ctaPrimary: { text: 'Passer en Premium', href: '/pricing' },
      };
  }
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function PremiumOverlay({ articleId, articleTitle, isPremium }: PremiumOverlayProps) {
  const { isSignedIn, userRole, premiumArticlesUsed, user, isLoading } = useAuth();
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [configuredLimit, setConfiguredLimit] = useState<number | undefined>(undefined);
  const [email, setEmail] = useState('');
  const hasTriggered = useRef(false);
  const mountedRef = useRef(true);
  const pageLoadTime = useRef(Date.now());
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<Element | null>(null);

  // Fetch configurable limit from paywall config
  useEffect(() => {
    if (!isPremium) return;
    fetch('/api/paywall-config')
      .then((r) => r.ok ? r.json() : null)
      .then((cfg) => {
        if (cfg?.free_articles_count) setConfiguredLimit(cfg.free_articles_count);
      })
      .catch(() => {});
  }, [isPremium]);

  const overlayCase = getOverlayCase(isSignedIn, userRole, premiumArticlesUsed, isPremium, configuredLimit);
  const limit = getReaderPremiumLimit(configuredLimit);
  const remaining = Math.max(0, limit - premiumArticlesUsed);
  const config = getOverlayConfig(overlayCase, remaining);

  useEffect(() => {
    mountedRef.current = true;
    pageLoadTime.current = Date.now();
    return () => {
      mountedRef.current = false;
      document.body.style.overflow = '';
    };
  }, []);

  // ─── Focus trap & keyboard handling ────────────────────────────────────────

  useEffect(() => {
    if (!visible) return;

    previousFocusRef.current = document.activeElement;

    requestAnimationFrame(() => {
      dialogRef.current?.focus();
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleDismiss();
        return;
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (previousFocusRef.current instanceof HTMLElement) {
        previousFocusRef.current.focus();
      }
    };
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Show overlay logic ────────────────────────────────────────────────────

  const showOverlay = useCallback(() => {
    if (hasTriggered.current || !mountedRef.current) return;
    if (wasDismissedRecently() && !config?.isBlocking) return;
    hasTriggered.current = true;
    setVisible(true);

    if (config?.isBlocking) {
      document.body.style.overflow = 'hidden';
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (mountedRef.current) setAnimateIn(true);
      });
    });

    const scrollMax = document.documentElement.scrollHeight - window.innerHeight;
    const readTimeSeconds = Math.round((Date.now() - pageLoadTime.current) / 1000);
    const scrollDepth = scrollMax > 0 ? Math.round((window.scrollY / scrollMax) * 100) : 0;

    trackOverlayEvent('view', {
      articleId,
      userId: user?.id,
      scrollDepth,
      readTimeSeconds,
      overlayCase,
    });
  }, [config?.isBlocking, articleId, user?.id, overlayCase]);

  // ─── Throttled scroll trigger ──────────────────────────────────────────────

  useEffect(() => {
    if (isLoading || !config || !isPremium) return;

    let ticking = false;

    const handleScroll = () => {
      if (hasTriggered.current || ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        ticking = false;
        if (hasTriggered.current) return;
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (scrollHeight <= 0) return;
        const percent = (window.scrollY / scrollHeight) * 100;
        if (percent >= config.scrollTriggerPercent) {
          showOverlay();
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLoading, config, isPremium, showOverlay]);

  // ─── Dismiss / Continue handlers ───────────────────────────────────────────

  const handleDismiss = useCallback(() => {
    setAnimateIn(false);
    markDismissed();
    document.body.style.overflow = '';

    trackOverlayEvent('dismiss', { articleId, userId: user?.id, overlayCase });

    setTimeout(() => {
      if (mountedRef.current) setVisible(false);
    }, 300);
  }, [articleId, user?.id, overlayCase]);

  const handleContinueReading = useCallback(() => {
    setAnimateIn(false);
    markDismissed();
    document.body.style.overflow = '';

    trackOverlayEvent('continue_reading', { articleId, userId: user?.id, overlayCase });

    setTimeout(() => {
      if (mountedRef.current) setVisible(false);
    }, 300);
  }, [articleId, user?.id, overlayCase]);

  const handleCtaClick = useCallback((ctaType: string) => {
    trackOverlayEvent(`click_${ctaType}`, { articleId, userId: user?.id, overlayCase });
  }, [articleId, user?.id, overlayCase]);

  const handleEmailSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    trackOverlayEvent('click_primary', { articleId, userId: user?.id, overlayCase });
    const params = new URLSearchParams();
    if (email) params.set('email', email);
    if (articleId) params.set('redirect', `/articles/${articleId}`);
    router.push(`/connexion${params.toString() ? '?' + params.toString() : ''}`);
  }, [email, articleId, user?.id, overlayCase, router]);

  // ─── Render ────────────────────────────────────────────────────────────────

  if (!config || !isPremium || isLoading) return null;
  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[100] motion-safe:transition-all motion-safe:duration-500 ${
          animateIn ? 'bg-black/80' : 'bg-black/0'
        }`}
        onClick={handleDismiss}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="premium-overlay-title"
        aria-describedby="premium-overlay-desc"
        tabIndex={-1}
        className={`fixed inset-0 z-[101] flex items-center justify-center p-4 outline-none motion-safe:transition-all motion-safe:duration-400 ease-out ${
          animateIn ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-auto relative overflow-hidden">
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 focus:outline-none transition-colors z-10"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="px-6 pb-8 pt-8 sm:px-8">
            {/* Title */}
            <h2
              id="premium-overlay-title"
              className="text-[22px] sm:text-[26px] font-bold leading-tight text-gray-900 mb-2"
            >
              {config.title}
            </h2>

            {/* Message */}
            <p
              id="premium-overlay-desc"
              className="text-[14px] sm:text-[15px] text-gray-500 leading-relaxed mb-6"
            >
              {config.message}
            </p>

            {/* Article title card */}
            {articleTitle && (
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <p className="text-[14px] sm:text-[15px] font-semibold text-gray-900 leading-snug">
                  {articleTitle}
                </p>
              </div>
            )}

            {/* Counter text */}
            {config.counterText && (
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <p className="text-[14px] text-gray-600 font-medium">
                  {config.counterText}
                </p>
              </div>
            )}

            {/* Email field for not_connected */}
            {config.showEmailField ? (
              <form onSubmit={handleEmailSubmit} className="mb-6">
                <label htmlFor="overlay-email" className="block text-[14px] font-medium text-gray-900 mb-2">
                  Email
                </label>
                <input
                  id="overlay-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-shadow"
                />

                <button
                  type="submit"
                  className="w-full mt-4 py-3.5 bg-gray-900 text-white rounded-xl text-[14px] sm:text-[15px] font-semibold hover:bg-black active:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors"
                >
                  {config.ctaPrimary.text}
                </button>
              </form>
            ) : (
              /* CTA buttons for other cases */
              <div className="flex flex-col gap-3 mb-6">
                {config.ctaPrimary.href === '' ? (
                  <button
                    onClick={handleContinueReading}
                    className="w-full py-3.5 bg-gray-900 text-white rounded-xl text-[14px] sm:text-[15px] font-semibold hover:bg-black active:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors"
                  >
                    {config.ctaPrimary.text}
                  </button>
                ) : (
                  <Link
                    href={config.ctaPrimary.href}
                    onClick={() => handleCtaClick('primary')}
                    className="w-full py-3.5 bg-gray-900 text-white rounded-xl text-[14px] sm:text-[15px] font-semibold hover:bg-black active:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors text-center"
                  >
                    {config.ctaPrimary.text}
                  </Link>
                )}

                {config.ctaSecondary && (
                  <Link
                    href={config.ctaSecondary.href}
                    onClick={() => handleCtaClick('secondary')}
                    className="w-full py-3 border border-gray-200 text-gray-700 rounded-xl text-[13px] sm:text-[14px] font-medium hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors text-center"
                  >
                    {config.ctaSecondary.text}
                  </Link>
                )}
              </div>
            )}

            {/* Separator + secondary link for not_connected */}
            {config.showEmailField && config.ctaSecondary && (
              <>
                <div className="border-t border-gray-100 mb-6" />
                <p className="text-center text-[13px] text-gray-500 mb-6">
                  Nouveau sur la plateforme ?{' '}
                  <Link
                    href={config.ctaSecondary.href}
                    onClick={() => handleCtaClick('secondary')}
                    className="font-semibold text-gray-900 hover:underline"
                  >
                    {config.ctaSecondary.text}
                  </Link>
                </p>
              </>
            )}

            {/* Benefits */}
            {config.benefits && config.benefits.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-5">
                <p className="text-[13px] sm:text-[14px] font-semibold text-gray-900 mb-3">
                  {overlayCase === 'not_connected' ? 'Acces authentifie :' : 'Avantages Premium :'}
                </p>
                <div className="space-y-2">
                  {config.benefits.map((benefit, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-[13px] text-gray-600">
                      <Check className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X, Check, Lock, Crown, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getReaderPremiumLimit } from '@/lib/access-control';
import { PREMIUM_TIER, PREMIUM_MONTHLY_PRICE, CURRENCY } from '@/config/pricing';
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
  counterRemaining?: number;
  counterTotal?: number;
  showEmailField?: boolean;
  accent: 'gold' | 'dark';
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

function getOverlayConfig(overlayCase: OverlayCase, remaining: number, limit: number): OverlayConfig | null {
  switch (overlayCase) {
    case 'premium':
    case 'admin':
      return null;

    case 'not_connected':
      return {
        isBlocking: true,
        scrollTriggerPercent: 30,
        title: 'Cet article est réservé aux membres',
        message: 'Connectez-vous ou créez un compte pour continuer votre lecture.',
        showEmailField: true,
        accent: 'dark',
        benefits: [
          'Accès aux contenus premium',
          'Interaction avec la communauté',
          'Alertes et notifications',
          'Personnalisation de l\'expérience',
        ],
        ctaPrimary: { text: 'Se connecter', href: '/connexion' },
        ctaSecondary: { text: 'Créer un compte gratuitement', href: '/inscription' },
      };

    case 'connected_has_articles':
      return {
        isBlocking: false,
        scrollTriggerPercent: 40,
        title: 'Article Premium',
        message: 'Vous bénéficiez d\'articles premium gratuits chaque mois.',
        accent: 'gold',
        counterText: `${remaining} article${remaining !== 1 ? 's' : ''} restant${remaining !== 1 ? 's' : ''} ce mois`,
        counterRemaining: remaining,
        counterTotal: limit,
        ctaPrimary: { text: 'Continuer la lecture', href: '' },
        ctaSecondary: { text: 'Passer en Premium', href: '/pricing' },
      };

    case 'connected_no_articles':
      return {
        isBlocking: true,
        scrollTriggerPercent: 30,
        title: 'Limite atteinte',
        message: `Vous avez lu vos ${limit} articles premium gratuits ce mois-ci. Passez en Premium pour un accès illimité.`,
        accent: 'gold',
        benefits: PREMIUM_TIER.features.slice(0, 4),
        ctaPrimary: { text: `Premium — ${PREMIUM_MONTHLY_PRICE.toLocaleString('fr-FR')} ${CURRENCY}/mois`, href: '/pricing' },
      };

    case 'reader_has_articles':
      return {
        isBlocking: false,
        scrollTriggerPercent: 40,
        title: 'Article Premium',
        message: 'Votre formule inclut des analyses premium par mois.',
        accent: 'gold',
        counterText: `${remaining} article${remaining !== 1 ? 's' : ''} restant${remaining !== 1 ? 's' : ''} ce mois`,
        counterRemaining: remaining,
        counterTotal: limit,
        ctaPrimary: { text: 'Continuer la lecture', href: '' },
        ctaSecondary: { text: 'Passer en Premium', href: '/pricing' },
      };

    case 'reader_no_articles':
      return {
        isBlocking: true,
        scrollTriggerPercent: 30,
        title: 'Limite mensuelle atteinte',
        message: 'Passez en Premium pour un accès illimité à toutes nos analyses.',
        accent: 'gold',
        benefits: PREMIUM_TIER.features.slice(0, 4),
        ctaPrimary: { text: `Premium — ${PREMIUM_MONTHLY_PRICE.toLocaleString('fr-FR')} ${CURRENCY}/mois`, href: '/pricing' },
      };
  }
}

// ─── Counter dots component ─────────────────────────────────────────────────

function ArticleCounter({ remaining, total }: { remaining: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`w-2.5 h-2.5 rounded-full transition-colors ${
            i < remaining ? 'bg-[#d4a843]' : 'bg-gray-200'
          }`}
        />
      ))}
    </div>
  );
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
  const config = getOverlayConfig(overlayCase, remaining, limit);

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
    }, 350);
  }, [articleId, user?.id, overlayCase]);

  const handleContinueReading = useCallback(() => {
    setAnimateIn(false);
    markDismissed();
    document.body.style.overflow = '';

    trackOverlayEvent('continue_reading', { articleId, userId: user?.id, overlayCase });

    setTimeout(() => {
      if (mountedRef.current) setVisible(false);
    }, 350);
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

  const isGold = config.accent === 'gold';

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[100] motion-safe:transition-opacity motion-safe:duration-400 ${
          animateIn ? 'bg-black/70 backdrop-blur-sm' : 'bg-black/0'
        }`}
        onClick={!config.isBlocking ? handleDismiss : undefined}
        aria-hidden="true"
      />

      {/* Dialog container — bottom sheet on mobile, centered on desktop */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="premium-overlay-title"
        aria-describedby="premium-overlay-desc"
        tabIndex={-1}
        className={`fixed inset-x-0 bottom-0 sm:inset-0 z-[101] sm:flex sm:items-center sm:justify-center outline-none`}
      >
        {/* Panel — slides up on mobile, scales in on desktop */}
        <div
          className={`
            w-full sm:max-w-[420px] sm:mx-4 bg-white
            rounded-t-[20px] sm:rounded-2xl
            shadow-[0_-8px_40px_-12px_rgba(0,0,0,0.25)] sm:shadow-2xl
            overflow-hidden
            motion-safe:transition-all motion-safe:duration-400 motion-safe:ease-out
            ${animateIn
              ? 'translate-y-0 sm:translate-y-0 sm:scale-100 opacity-100'
              : 'translate-y-full sm:translate-y-4 sm:scale-95 opacity-0 sm:opacity-0'
            }
          `}
        >
          {/* Drag handle — mobile only */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1 rounded-full bg-gray-300" />
          </div>

          {/* Top accent bar */}
          <div className={`h-1 ${isGold ? 'bg-gradient-to-r from-[#d4a843] via-[#e8c36a] to-[#d4a843]' : 'bg-gray-900'} sm:rounded-t-2xl`} />

          {/* Close button */}
          {!config.isBlocking && (
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 sm:top-3 sm:right-3 w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 active:bg-gray-300 focus:outline-none transition-colors z-10"
              aria-label="Fermer"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          )}

          <div className="px-5 pb-6 pt-4 sm:px-7 sm:pb-7 sm:pt-5 max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
            {/* Icon */}
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
              isGold ? 'bg-[#d4a843]/10' : 'bg-gray-100'
            }`}>
              {isGold ? (
                <Crown className="w-6 h-6 text-[#d4a843]" />
              ) : (
                <Lock className="w-5 h-5 text-gray-700" />
              )}
            </div>

            {/* Title */}
            <h2
              id="premium-overlay-title"
              className="text-[20px] sm:text-[22px] font-bold leading-tight text-gray-900 mb-1.5"
            >
              {config.title}
            </h2>

            {/* Message */}
            <p
              id="premium-overlay-desc"
              className="text-[14px] text-gray-500 leading-relaxed mb-5"
            >
              {config.message}
            </p>

            {/* Article counter dots */}
            {config.counterRemaining !== undefined && config.counterTotal !== undefined && (
              <div className="flex items-center gap-3 bg-[#faf8f3] rounded-xl p-3.5 mb-5">
                <ArticleCounter remaining={config.counterRemaining} total={config.counterTotal} />
                <span className="text-[13px] text-gray-600 font-medium">{config.counterText}</span>
              </div>
            )}

            {/* Article title preview */}
            {articleTitle && config.isBlocking && (
              <div className="bg-gray-50 rounded-xl p-3.5 mb-5 border border-gray-100">
                <p className="text-[13px] sm:text-[14px] font-semibold text-gray-900 leading-snug line-clamp-2">
                  {articleTitle}
                </p>
              </div>
            )}

            {/* Email field for not_connected */}
            {config.showEmailField ? (
              <form onSubmit={handleEmailSubmit} className="mb-5">
                <label htmlFor="overlay-email" className="block text-[13px] font-medium text-gray-700 mb-1.5">
                  Adresse email
                </label>
                <input
                  id="overlay-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-shadow"
                  autoComplete="email"
                />

                <button
                  type="submit"
                  className="w-full mt-3 py-3.5 bg-gray-900 text-white rounded-xl text-[15px] font-semibold hover:bg-black active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-all flex items-center justify-center gap-2"
                >
                  {config.ctaPrimary.text}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              /* CTA buttons for other cases */
              <div className="flex flex-col gap-2.5 mb-5">
                {config.ctaPrimary.href === '' ? (
                  <button
                    onClick={handleContinueReading}
                    className={`w-full py-3.5 rounded-xl text-[15px] font-semibold active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all flex items-center justify-center gap-2 ${
                      isGold
                        ? 'bg-[#d4a843] text-white hover:bg-[#c49a3a] focus:ring-[#d4a843]'
                        : 'bg-gray-900 text-white hover:bg-black focus:ring-gray-900'
                    }`}
                  >
                    {config.ctaPrimary.text}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <Link
                    href={config.ctaPrimary.href}
                    onClick={() => handleCtaClick('primary')}
                    className={`w-full py-3.5 rounded-xl text-[15px] font-semibold active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all flex items-center justify-center gap-2 ${
                      isGold
                        ? 'bg-[#d4a843] text-white hover:bg-[#c49a3a] focus:ring-[#d4a843]'
                        : 'bg-gray-900 text-white hover:bg-black focus:ring-gray-900'
                    }`}
                  >
                    {config.ctaPrimary.text}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}

                {config.ctaSecondary && (
                  <Link
                    href={config.ctaSecondary.href}
                    onClick={() => handleCtaClick('secondary')}
                    className="w-full py-3 border border-gray-200 text-gray-700 rounded-xl text-[14px] font-medium hover:bg-gray-50 active:bg-gray-100 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-all text-center"
                  >
                    {config.ctaSecondary.text}
                  </Link>
                )}
              </div>
            )}

            {/* Separator + secondary link for not_connected */}
            {config.showEmailField && config.ctaSecondary && (
              <div className="text-center mb-5">
                <div className="border-t border-gray-100 mb-4" />
                <p className="text-[13px] text-gray-500">
                  Pas encore de compte ?{' '}
                  <Link
                    href={`${config.ctaSecondary.href}${email ? '?email=' + encodeURIComponent(email) : ''}`}
                    onClick={() => handleCtaClick('secondary')}
                    className="font-semibold text-gray-900 hover:underline"
                  >
                    {config.ctaSecondary.text}
                  </Link>
                </p>
              </div>
            )}

            {/* Benefits */}
            {config.benefits && config.benefits.length > 0 && (
              <div className={`rounded-xl p-4 ${isGold ? 'bg-[#faf8f3]' : 'bg-gray-50'}`}>
                <p className="text-[13px] font-semibold text-gray-900 mb-2.5">
                  {overlayCase === 'not_connected' ? 'En créant un compte :' : 'Avantages Premium :'}
                </p>
                <div className="space-y-2">
                  {config.benefits.map((benefit, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-[13px] text-gray-600">
                      <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isGold ? 'text-[#d4a843]' : 'text-gray-400'}`} />
                      <span className="leading-snug">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Safe area bottom padding for mobile */}
          <div className="h-[env(safe-area-inset-bottom,0px)] sm:hidden" />
        </div>
      </div>
    </>
  );
}

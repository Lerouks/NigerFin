'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { X, Lock, ArrowRight, Crown, BookOpen, BarChart3, Globe, Zap, TrendingUp } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getReaderPremiumLimit } from '@/lib/access-control';

// ─── Types ───────────────────────────────────────────────────────────────────

type OverlayCase =
  | 'not_connected'           // Case 1: not logged in
  | 'connected_has_articles'  // Case 2a: logged in, free articles remaining
  | 'connected_no_articles'   // Case 2b: logged in, no free articles left
  | 'reader_has_articles'     // Case 3a: reader plan, articles remaining
  | 'reader_no_articles'      // Case 3b: reader plan, no articles left
  | 'premium'                 // Case 4: premium user
  | 'admin';                  // Admin - skip

interface OverlayConfig {
  isBlocking: boolean;
  scrollTriggerPercent: number;
  title: string;
  message: string;
  arguments?: string[];
  ctaPrimary: { text: string; href: string };
  ctaSecondary?: { text: string; href: string };
  counterText?: string;
  showCloseButton: boolean;
}

interface PremiumOverlayProps {
  articleId?: string;
  isPremium: boolean;
}

// ─── Session & Analytics helpers ─────────────────────────────────────────────

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
  // Don't show again for 4 hours after dismiss
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

// ─── Determine overlay case ─────────────────────────────────────────────────

function getOverlayCase(
  isSignedIn: boolean,
  userRole: string | null,
  premiumArticlesUsed: number,
  isPremiumArticle: boolean
): OverlayCase {
  if (!isPremiumArticle) return 'premium'; // No overlay for free articles

  if (!isSignedIn) return 'not_connected';

  if (userRole === 'admin') return 'admin';
  if (userRole === 'premium') return 'premium';

  const limit = getReaderPremiumLimit();

  if (userRole === 'reader') {
    return premiumArticlesUsed < limit ? 'reader_has_articles' : 'reader_no_articles';
  }

  // Connected but no subscription (treated as free user)
  return premiumArticlesUsed < limit ? 'connected_has_articles' : 'connected_no_articles';
}

// ─── Get overlay config for each case ────────────────────────────────────────

function getOverlayConfig(overlayCase: OverlayCase, remaining: number): OverlayConfig | null {
  switch (overlayCase) {
    case 'premium':
    case 'admin':
      return null; // No overlay

    case 'not_connected':
      return {
        isBlocking: true,
        scrollTriggerPercent: 30,
        title: 'Cet article est r\u00e9serv\u00e9 aux membres',
        message: 'Acc\u00e9dez \u00e0 l\'analyse compl\u00e8te et \u00e0 l\'ensemble des contenus premium.',
        arguments: [
          'Analyses \u00e9conomiques exclusives',
          'D\u00e9cryptages g\u00e9opolitiques',
          'Acc\u00e8s aux outils et donn\u00e9es avanc\u00e9es',
          '3 articles premium gratuits chaque mois',
        ],
        ctaPrimary: { text: 'S\'inscrire gratuitement', href: '/inscription' },
        ctaSecondary: { text: 'D\u00e9j\u00e0 membre ? Se connecter', href: '/connexion' },
        showCloseButton: false,
      };

    case 'connected_has_articles':
      return {
        isBlocking: false,
        scrollTriggerPercent: 40,
        title: 'Articles premium gratuits',
        message: `B\u00e9n\u00e9ficiez de 3 articles premium gratuits chaque mois.`,
        counterText: `Il vous reste ${remaining} article${remaining !== 1 ? 's' : ''}.`,
        ctaPrimary: { text: 'Continuer la lecture', href: '' }, // Empty = dismiss
        ctaSecondary: { text: 'Passer en Premium', href: '/pricing' },
        showCloseButton: true,
      };

    case 'connected_no_articles':
      return {
        isBlocking: true,
        scrollTriggerPercent: 30,
        title: 'Vous avez utilis\u00e9 vos 3 articles premium gratuits',
        message: 'Passez en Premium pour un acc\u00e8s illimit\u00e9 aux analyses et aux outils.',
        arguments: [
          'Acc\u00e8s illimit\u00e9 aux articles',
          'Analyses \u00e9conomiques approfondies',
          'Outils d\'analyse automatique',
          'Donn\u00e9es march\u00e9s en temps r\u00e9el',
        ],
        ctaPrimary: { text: 'Passer en Premium', href: '/pricing' },
        ctaSecondary: { text: 'Voir les offres', href: '/pricing' },
        showCloseButton: false,
      };

    case 'reader_has_articles':
      return {
        isBlocking: false,
        scrollTriggerPercent: 40,
        title: 'Formule Lecteur',
        message: 'Votre formule inclut 3 analyses premium par mois.',
        counterText: `Il vous reste ${remaining} article${remaining !== 1 ? 's' : ''}.`,
        ctaPrimary: { text: 'Continuer la lecture', href: '' },
        ctaSecondary: { text: 'Passer en Premium illimit\u00e9', href: '/pricing' },
        showCloseButton: true,
      };

    case 'reader_no_articles':
      return {
        isBlocking: true,
        scrollTriggerPercent: 30,
        title: 'Limite mensuelle atteinte',
        message: 'La formule Lecteur inclut 3 analyses premium par mois. Passez en Premium pour un acc\u00e8s illimit\u00e9.',
        arguments: [
          'Acc\u00e8s total aux analyses',
          'Acc\u00e8s complet aux outils',
          'Contenu exclusif r\u00e9serv\u00e9 aux membres Premium',
        ],
        ctaPrimary: { text: 'Passer en Premium', href: '/pricing' },
        showCloseButton: false,
      };
  }
}

// ─── Argument icon mapping ───────────────────────────────────────────────────

function ArgumentIcon({ index }: { index: number }) {
  const icons = [BookOpen, Globe, BarChart3, Zap, TrendingUp, Crown];
  const Icon = icons[index % icons.length];
  return <Icon className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function PremiumOverlay({ articleId, isPremium }: PremiumOverlayProps) {
  const { isSignedIn, userRole, premiumArticlesUsed, user, isLoading } = useAuth();
  const [visible, setVisible] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const hasTriggered = useRef(false);
  const mountedRef = useRef(true);
  const pageLoadTime = useRef(Date.now());

  // Determine user case
  const overlayCase = getOverlayCase(isSignedIn, userRole, premiumArticlesUsed, isPremium);
  const limit = getReaderPremiumLimit();
  const remaining = Math.max(0, limit - premiumArticlesUsed);
  const config = getOverlayConfig(overlayCase, remaining);

  useEffect(() => {
    mountedRef.current = true;
    pageLoadTime.current = Date.now();
    return () => { mountedRef.current = false; };
  }, []);

  const showOverlay = useCallback(() => {
    if (hasTriggered.current || !mountedRef.current) return;
    if (wasDismissedRecently() && !config?.isBlocking) return;
    hasTriggered.current = true;
    setVisible(true);

    // Lock scroll for blocking overlays
    if (config?.isBlocking) {
      document.body.style.overflow = 'hidden';
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (mountedRef.current) setAnimateIn(true);
      });
    });

    const readTimeSeconds = Math.round((Date.now() - pageLoadTime.current) / 1000);
    const scrollDepth = Math.round(
      (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
    );

    trackOverlayEvent('view', {
      articleId,
      userId: user?.id,
      scrollDepth,
      readTimeSeconds,
      overlayCase,
    });
  }, [config?.isBlocking, articleId, user?.id, overlayCase]);

  // Scroll-based trigger
  useEffect(() => {
    if (isLoading || !config || !isPremium) return;

    const handleScroll = () => {
      if (hasTriggered.current) return;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight <= 0) return;
      const percent = (window.scrollY / scrollHeight) * 100;
      if (percent >= config.scrollTriggerPercent) {
        showOverlay();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLoading, config, isPremium, showOverlay]);

  const handleDismiss = useCallback(() => {
    if (config?.isBlocking) return; // Can't dismiss blocking overlays

    setAnimateIn(false);
    markDismissed();

    trackOverlayEvent('dismiss', {
      articleId,
      userId: user?.id,
      overlayCase,
    });

    setTimeout(() => {
      if (mountedRef.current) setVisible(false);
    }, 300);
  }, [config?.isBlocking, articleId, user?.id, overlayCase]);

  const handleContinueReading = useCallback(() => {
    setAnimateIn(false);
    markDismissed();

    trackOverlayEvent('continue_reading', {
      articleId,
      userId: user?.id,
      overlayCase,
    });

    setTimeout(() => {
      if (mountedRef.current) setVisible(false);
    }, 300);
  }, [articleId, user?.id, overlayCase]);

  const handleCtaClick = useCallback((ctaType: string) => {
    trackOverlayEvent(`click_${ctaType}`, {
      articleId,
      userId: user?.id,
      overlayCase,
    });
  }, [articleId, user?.id, overlayCase]);

  // No overlay needed
  if (!config || !isPremium || isLoading) return null;
  if (!visible) return null;

  const isBlocking = config.isBlocking;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[100] transition-all duration-500 ${
          animateIn
            ? isBlocking
              ? 'bg-black/60 backdrop-blur-sm'
              : 'bg-black/40 backdrop-blur-[2px]'
            : 'bg-black/0 backdrop-blur-0'
        }`}
        onClick={!isBlocking ? handleDismiss : undefined}
      />

      {/* Overlay panel */}
      <div
        className={`fixed inset-x-0 bottom-0 z-[101] transition-all duration-500 ease-out ${
          animateIn ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
      >
        <div className="bg-white rounded-t-3xl shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.2)] max-w-xl mx-auto relative overflow-hidden">
          {/* Decorative top bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-500" />

          {/* Drag indicator (mobile feel) */}
          <div className="flex justify-center pt-4 pb-2">
            <div className="w-10 h-1 rounded-full bg-gray-200" />
          </div>

          {/* Close button (non-blocking only) */}
          {config.showCloseButton && (
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-all z-10"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="px-6 pb-8 pt-2 sm:px-8">
            {/* Icon */}
            <div className="flex justify-center mb-5">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                isBlocking
                  ? 'bg-gradient-to-br from-amber-50 to-amber-100'
                  : 'bg-gradient-to-br from-emerald-50 to-emerald-100'
              }`}>
                {isBlocking ? (
                  <Lock className="w-6 h-6 text-amber-600" />
                ) : (
                  <Crown className="w-6 h-6 text-emerald-600" />
                )}
              </div>
            </div>

            {/* Title */}
            <h2 className="text-center text-[22px] sm:text-[26px] font-extrabold leading-tight text-gray-900 mb-2">
              {config.title}
            </h2>

            {/* Message */}
            <p className="text-center text-[14px] sm:text-[15px] text-gray-500 leading-relaxed mb-5 max-w-md mx-auto">
              {config.message}
            </p>

            {/* Counter badge */}
            {config.counterText && (
              <div className="flex justify-center mb-5">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-[13px] font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {config.counterText}
                </span>
              </div>
            )}

            {/* Marketing arguments */}
            {config.arguments && config.arguments.length > 0 && (
              <div className="mb-6 space-y-2.5 max-w-sm mx-auto">
                {config.arguments.map((arg, i) => (
                  <div key={i} className="flex items-start gap-3 text-[13px] sm:text-[14px] text-gray-700">
                    <ArgumentIcon index={i} />
                    <span>{arg}</span>
                  </div>
                ))}
              </div>
            )}

            {/* CTA buttons */}
            <div className="flex flex-col gap-3 max-w-sm mx-auto">
              {config.ctaPrimary.href === '' ? (
                // "Continue reading" button (dismisses overlay)
                <button
                  onClick={handleContinueReading}
                  className="w-full py-3.5 bg-[#111] text-white rounded-xl text-[14px] sm:text-[15px] font-semibold hover:bg-[#222] active:bg-[#000] transition-colors flex items-center justify-center gap-2"
                >
                  {config.ctaPrimary.text}
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <Link
                  href={config.ctaPrimary.href}
                  onClick={() => handleCtaClick('primary')}
                  className="w-full py-3.5 bg-[#111] text-white rounded-xl text-[14px] sm:text-[15px] font-semibold hover:bg-[#222] active:bg-[#000] transition-colors flex items-center justify-center gap-2 text-center"
                >
                  {config.ctaPrimary.text}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}

              {config.ctaSecondary && (
                <Link
                  href={config.ctaSecondary.href}
                  onClick={() => handleCtaClick('secondary')}
                  className="w-full py-3 border border-gray-200 text-gray-700 rounded-xl text-[13px] sm:text-[14px] font-medium hover:bg-gray-50 active:bg-gray-100 transition-colors text-center"
                >
                  {config.ctaSecondary.text}
                </Link>
              )}
            </div>

            {/* Note for non-connected users */}
            {overlayCase === 'not_connected' && (
              <p className="text-center text-[11px] text-gray-400 mt-4">
                Inscription gratuite, sans engagement.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

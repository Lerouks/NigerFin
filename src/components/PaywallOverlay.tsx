'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { X, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getVisitorArticlesRead, getVisitorLimit } from '@/lib/access-control';

interface PaywallConfig {
  enabled: boolean;
  trigger_type: 'scroll' | 'time' | 'both';
  scroll_percent: number;
  delay_seconds: number;
  title: string;
  message: string;
  cta_subscribe_text: string;
  cta_login_text: string;
  cta_dismiss_text: string;
  dismiss_cookie_hours: number;
  show_article_counter: boolean;
  counter_message: string;
  bg_color: string;
  text_color: string;
  cta_bg_color: string;
  cta_text_color: string;
}

const DISMISS_COOKIE = 'nfi_paywall_dismissed';
const SESSION_ID_KEY = 'nfi_session_id';

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sid = sessionStorage.getItem(SESSION_ID_KEY);
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem(SESSION_ID_KEY, sid);
  }
  return sid;
}

function isDismissed(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.includes(DISMISS_COOKIE + '=');
}

function setDismissCookie(hours: number): void {
  const expires = new Date(Date.now() + hours * 3600 * 1000).toUTCString();
  document.cookie = `${DISMISS_COOKIE}=1;expires=${expires};path=/;SameSite=Lax`;
}

function trackEvent(eventType: string, articleId?: string, userId?: string) {
  fetch('/api/paywall/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_type: eventType,
      article_id: articleId,
      user_id: userId,
      session_id: getSessionId(),
    }),
  }).catch(() => {});
}

interface PaywallOverlayProps {
  articleId?: string;
}

export function PaywallOverlay({ articleId }: PaywallOverlayProps) {
  const { isSignedIn, userRole, user } = useAuth();
  const [config, setConfig] = useState<PaywallConfig | null>(null);
  const [visible, setVisible] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const hasTriggered = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const mountedRef = useRef(true);

  // Don't show to subscribers or admins
  const shouldSkip = isSignedIn && (userRole === 'premium' || userRole === 'admin');

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Fetch config
  useEffect(() => {
    if (shouldSkip) return;
    fetch('/api/paywall')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data && mountedRef.current) setConfig(data); })
      .catch(() => {});
  }, [shouldSkip]);

  const showOverlay = useCallback(() => {
    if (hasTriggered.current || !config?.enabled || !mountedRef.current) return;
    if (isDismissed()) return;
    hasTriggered.current = true;
    setVisible(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (mountedRef.current) setAnimateIn(true);
      });
    });
    trackEvent('view', articleId, user?.id);
  }, [config?.enabled, config?.dismiss_cookie_hours, articleId, user?.id]);

  // Time-based trigger
  useEffect(() => {
    if (!config?.enabled || shouldSkip || hasTriggered.current) return;
    if (config.trigger_type === 'scroll') return;
    timerRef.current = setTimeout(showOverlay, config.delay_seconds * 1000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [config?.enabled, config?.trigger_type, config?.delay_seconds, shouldSkip, showOverlay]);

  // Scroll-based trigger
  useEffect(() => {
    if (!config?.enabled || shouldSkip) return;
    if (config.trigger_type === 'time') return;

    const handleScroll = () => {
      if (hasTriggered.current) return;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight <= 0) return;
      const percent = (window.scrollY / scrollHeight) * 100;
      if (percent >= config.scroll_percent) {
        showOverlay();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [config?.enabled, config?.trigger_type, config?.scroll_percent, shouldSkip, showOverlay]);

  const handleDismiss = () => {
    setAnimateIn(false);
    trackEvent('dismiss', articleId, user?.id);
    setTimeout(() => { if (mountedRef.current) setVisible(false); }, 300);
    if (config) setDismissCookie(config.dismiss_cookie_hours);
  };

  const handleSubscribeClick = () => {
    trackEvent('click_subscribe', articleId, user?.id);
  };

  const handleLoginClick = () => {
    trackEvent('click_login', articleId, user?.id);
  };

  if (shouldSkip || !config?.enabled || !visible) return null;

  // Build counter message
  let counterText = '';
  if (config.show_article_counter && !isSignedIn) {
    const read = getVisitorArticlesRead();
    const limit = getVisitorLimit();
    const remaining = Math.max(0, limit - read);
    counterText = config.counter_message.replace('{remaining}', String(remaining));
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] transition-all duration-300 ${
          animateIn ? 'bg-black/50 backdrop-blur-[2px]' : 'bg-black/0 backdrop-blur-0'
        }`}
        onClick={handleDismiss}
      />

      {/* Overlay panel */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-[61] transition-transform duration-300 ease-out ${
          animateIn ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div
          className="rounded-t-2xl shadow-2xl px-6 py-8 md:px-10 md:py-10 max-w-2xl mx-auto relative"
          style={{ backgroundColor: config.bg_color, color: config.text_color }}
        >
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 opacity-50 hover:opacity-100 transition-opacity"
            style={{ color: config.text_color }}
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icon */}
          <div className="flex justify-center mb-5">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${config.text_color}15` }}
            >
              <Lock className="w-6 h-6" style={{ color: config.text_color }} />
            </div>
          </div>

          {/* Content */}
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: config.text_color }}>
              {config.title}
            </h2>
            <p className="mb-6 opacity-70 text-[15px] leading-relaxed max-w-md mx-auto" style={{ color: config.text_color }}>
              {config.message}
            </p>

            {/* Article counter */}
            {counterText && (
              <p
                className="text-[13px] mb-5 px-4 py-2 rounded-lg inline-block"
                style={{ backgroundColor: `${config.text_color}10`, color: config.text_color, opacity: 0.8 }}
              >
                {counterText}
              </p>
            )}

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Link
                href="/pricing"
                onClick={handleSubscribeClick}
                className="flex items-center gap-2 px-8 py-3.5 rounded-lg font-semibold text-[14px] transition-opacity hover:opacity-90 w-full sm:w-auto justify-center"
                style={{ backgroundColor: config.cta_bg_color, color: config.cta_text_color }}
              >
                {config.cta_subscribe_text}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/connexion"
                onClick={handleLoginClick}
                className="text-[14px] opacity-70 hover:opacity-100 transition-opacity underline underline-offset-4"
                style={{ color: config.text_color }}
              >
                {config.cta_login_text}
              </Link>
            </div>

            {/* Dismiss */}
            <button
              onClick={handleDismiss}
              className="mt-5 text-[12px] opacity-40 hover:opacity-70 transition-opacity"
              style={{ color: config.text_color }}
            >
              {config.cta_dismiss_text}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

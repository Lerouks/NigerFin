'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { X, ArrowRight, Check, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

const DISMISS_KEY = 'nfi_newsletter_popup_dismissed';
const SUBSCRIBED_KEY = 'nfi_newsletter_subscribed';
const COOLDOWN_DAYS = 7;
const SCROLL_TRIGGER = 0.45;
const TIME_TRIGGER_MS = 30_000;

function wasDismissedRecently(): boolean {
  if (typeof window === 'undefined') return false;
  const ts = localStorage.getItem(DISMISS_KEY);
  if (!ts) return false;
  return Date.now() - parseInt(ts, 10) < COOLDOWN_DAYS * 24 * 3600 * 1000;
}

function markDismissed(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  }
}

export function isNewsletterSubscribed(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(SUBSCRIBED_KEY) === 'true';
}

export function markNewsletterSubscribed(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SUBSCRIBED_KEY, 'true');
  }
}

/**
 * Newsletter signup popup.
 * Shows once per session after 45% scroll OR 30 seconds.
 * Does NOT show for: premium/admin, already subscribed, dismissed recently, homepage.
 */
export function NewsletterPopup() {
  const { isLoading, userRole, profile } = useAuth();
  const [visible, setVisible] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
  const hasTriggered = useRef(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Wait for auth to resolve
    if (isLoading) return;

    // Don't show for premium/admin (already in newsletter)
    if (userRole === 'premium' || userRole === 'admin') return;

    // Don't show if already subscribed (profile DB or localStorage)
    if (profile?.newsletter_subscribed) return;
    if (isNewsletterSubscribed()) return;
    if (wasDismissedRecently()) return;

    // Don't show on homepage (newsletter form already visible)
    if (typeof window !== 'undefined' && window.location.pathname === '/') return;

    let ticking = false;

    const trigger = () => {
      if (hasTriggered.current) return;
      hasTriggered.current = true;
      setVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimateIn(true));
      });
    };

    const handleScroll = () => {
      if (hasTriggered.current || ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        if (hasTriggered.current) return;
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (scrollHeight <= 0) return;
        const percent = window.scrollY / scrollHeight;
        if (percent >= SCROLL_TRIGGER) trigger();
      });
    };

    const timer = setTimeout(trigger, TIME_TRIGGER_MS);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
    };
  }, [isLoading, userRole]);

  const handleClose = () => {
    setAnimateIn(false);
    markDismissed();
    setTimeout(() => setVisible(false), 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setSuccess(true);
      markNewsletterSubscribed();
      markDismissed();
      setTimeout(() => {
        setAnimateIn(false);
        setTimeout(() => setVisible(false), 300);
      }, 2000);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!visible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[90] transition-opacity duration-300 ${
          animateIn ? 'bg-black/50 backdrop-blur-sm' : 'bg-black/0'
        }`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Inscription à la newsletter"
        className="fixed inset-x-0 bottom-0 sm:inset-0 z-[91] sm:flex sm:items-center sm:justify-center"
      >
        <div
          className={`
            w-full sm:max-w-[400px] sm:mx-4 bg-white
            rounded-t-2xl sm:rounded-2xl
            shadow-2xl overflow-hidden
            transition-all duration-300 ease-out
            ${animateIn
              ? 'translate-y-0 sm:translate-y-0 sm:scale-100 opacity-100'
              : 'translate-y-full sm:translate-y-4 sm:scale-95 opacity-0'
            }
          `}
        >
          {/* Drag handle mobile */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1 rounded-full bg-gray-300" />
          </div>

          {/* Close */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors z-10"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="px-6 pb-6 pt-4 sm:px-7 sm:pb-7 sm:pt-6">
            {/* Mockup */}
            <div className="flex justify-center mb-5">
              <div className="relative w-32 sm:w-36">
                <Image
                  src="/images/mockup-phone.png"
                  alt="NFI Report"
                  width={400}
                  height={500}
                  className="w-full h-auto"
                />
              </div>
            </div>

            {/* Content */}
            <h3 className="text-[18px] sm:text-[20px] font-bold text-center text-[#111] mb-1.5">
              Ne manquez rien de l&apos;actualité économique
            </h3>
            <p className="text-[13px] sm:text-[14px] text-gray-500 text-center mb-5 leading-relaxed">
              Briefings, analyses et données de marché. Recevez le meilleur de NFI Report dans votre boîte mail.
            </p>

            {/* Form */}
            {success ? (
              <div className="flex items-center gap-3 bg-emerald-50 rounded-xl px-4 py-3.5">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-[14px] text-emerald-700 font-medium">Inscription confirmée !</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Votre adresse email"
                  required
                  autoComplete="email"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[14px] text-[#111] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#111] focus:border-transparent transition-shadow bg-[#fafaf9]"
                />
                {error && (
                  <p className="text-[12px] text-red-500">Une erreur est survenue. Réessayez.</p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#111] text-white rounded-xl text-[14px] font-semibold hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      S&apos;inscrire
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            <p className="text-[10px] text-gray-400 text-center mt-4">
              Gratuit, sans spam. Désabonnez-vous à tout moment.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

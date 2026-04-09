'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { isNewsletterSubscribed, markNewsletterSubscribed } from '@/components/NewsletterPopup';

export function NewsletterForm() {
  const { userRole, profile, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [alreadySubscribed, setAlreadySubscribed] = useState(false);

  // Check if already subscribed (profile DB, localStorage, or premium/admin)
  useEffect(() => {
    if (isNewsletterSubscribed()) {
      setAlreadySubscribed(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (userRole === 'premium' || userRole === 'admin' || profile?.newsletter_subscribed) {
        setAlreadySubscribed(true);
      }
    }
  }, [isLoading, userRole, profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setSubscribed(true);
      markNewsletterSubscribed();
      setTimeout(() => {
        setEmail('');
        setAlreadySubscribed(true);
      }, 3000);
    } catch {
      setEmail('');
      setError(true);
      setTimeout(() => setError(false), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="newsletter" className="relative overflow-hidden rounded-xl bg-[#111] p-8 md:p-10 scroll-mt-[180px]">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.02] rounded-full -translate-y-1/2 translate-x-1/2" />
      <h3 className="text-[22px] md:text-[26px] text-white mb-2 leading-tight font-semibold">
        Ne manquez rien de l&apos;actualité économique
      </h3>
      <p className="text-[14px] text-white/45 mb-7 max-w-md">
        Briefings, analyses et données de marché. Recevez le meilleur de NFI Report dans votre boîte mail.
      </p>

      {alreadySubscribed ? (
        <div className="flex items-center gap-3 bg-white/10 rounded-lg px-5 py-4">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <Check className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-[14px] text-white/80">Vous êtes déjà inscrit à la newsletter</p>
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 bg-red-500/10 rounded-lg px-5 py-4">
          <p className="text-[14px] text-red-400">Une erreur est survenue. Veuillez réessayer.</p>
        </div>
      ) : subscribed ? (
        <div className="flex items-center gap-3 bg-white/10 rounded-lg px-5 py-4">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <Check className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-[14px] text-white/80">Inscription confirmée !</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            id="newsletter-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Votre adresse email"
            aria-label="Adresse email pour la newsletter"
            autoComplete="email"
            className="flex-1 px-4 py-3 rounded-lg bg-white/[0.08] border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-all text-[14px]"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-white text-black px-6 py-3 rounded-lg hover:bg-white/90 transition-all duration-200 flex items-center justify-center gap-2 text-[14px] flex-shrink-0 disabled:opacity-50 active:scale-[0.97] font-medium"
          >
            {loading ? 'Envoi...' : 'S\'inscrire'}
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      )}
      <p className="text-[11px] text-white/20 mt-4">Gratuit, sans spam. Désabonnez-vous à tout moment.</p>
    </div>
  );
}

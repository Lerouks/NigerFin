'use client';

import { useState } from 'react';
import { ArrowRight, Check, Loader2 } from 'lucide-react';

export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

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
      setTimeout(() => {
        setEmail('');
        setSubscribed(false);
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
        Restez informé
      </h3>
      <p className="text-[14px] text-white/45 mb-7 max-w-md">
        Recevez les analyses économiques et financières du Niger et de l&apos;Afrique de l&apos;Ouest.
      </p>

      {error ? (
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
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Votre adresse email"
            aria-label="Adresse email pour la newsletter"
            className="flex-1 px-4 py-3 rounded-lg bg-white/[0.08] border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-all text-[14px]"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-white text-black px-6 py-3 rounded-lg hover:bg-white/90 transition-colors flex items-center justify-center gap-2 text-[14px] flex-shrink-0 disabled:opacity-50"
          >
            {loading ? 'Envoi...' : 'S\'abonner'}
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      )}
      <p className="text-[11px] text-white/20 mt-4">Gratuit, sans spam. Désabonnez-vous à tout moment.</p>
    </div>
  );
}

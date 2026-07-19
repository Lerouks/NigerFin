'use client';

import { useState } from 'react';
import { Loader2, Check, ArrowRight } from 'lucide-react';

type Status = 'idle' | 'loading' | 'success' | 'error';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === 'loading') return;

    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      setStatus('error');
      setMessage('Entrez une adresse email valide.');
      return;
    }

    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: value }),
      });
      if (res.ok) {
        setStatus('success');
      } else if (res.status === 429) {
        setStatus('error');
        setMessage('Trop de tentatives. Réessayez dans un moment.');
      } else {
        setStatus('error');
        setMessage('Un souci est survenu. Réessayez dans un instant.');
      }
    } catch {
      setStatus('error');
      setMessage('Vérifiez votre connexion et réessayez.');
    }
  }

  if (status === 'success') {
    return (
      <p
        className="flex items-center gap-2 text-[15px] font-medium text-[#16130d]"
        role="status"
        aria-live="polite"
      >
        <Check className="h-4 w-4 shrink-0 text-gold" />
        Merci. Vous recevrez le signal du lancement.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="flex items-center gap-3 border-b border-[#16130d]/25 pb-1 transition-colors duration-200 focus-within:border-gold">
        <label htmlFor="waitlist-email" className="sr-only">
          Votre adresse email
        </label>
        <input
          id="waitlist-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="votre@email.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === 'error') setStatus('idle');
          }}
          disabled={status === 'loading'}
          aria-invalid={status === 'error'}
          className="min-w-0 flex-1 bg-transparent py-2 text-[16px] text-[#16130d] placeholder:text-[#16130d]/35 focus:outline-none disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="inline-flex shrink-0 items-center gap-1.5 text-[15px] font-semibold text-[#16130d] transition-colors duration-200 hover:text-gold focus-visible:text-gold focus-visible:outline-none disabled:opacity-60"
        >
          {status === 'loading' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Envoi…</span>
            </>
          ) : (
            <>
              <span>M&apos;inscrire</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>

      <p
        className="mt-3 min-h-[1.25rem] text-[13px]"
        aria-live="polite"
        role={status === 'error' ? 'alert' : undefined}
      >
        {status === 'error' ? (
          <span className="text-[#b0402f]">{message}</span>
        ) : (
          <span className="text-[#16130d]/40">Un seul message : le jour du lancement. Rien d&apos;autre.</span>
        )}
      </p>
    </form>
  );
}

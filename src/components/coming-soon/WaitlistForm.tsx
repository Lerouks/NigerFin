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
      setMessage('Entrez une adresse e-mail valide.');
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
        className="flex items-center gap-2 border-b border-white/25 py-[14px] text-[15px] font-medium text-[#f4f4f5]"
        role="status"
        aria-live="polite"
      >
        <Check className="h-4 w-4 shrink-0" />
        Merci, c’est noté. Vous serez prévenu à l’ouverture.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label htmlFor="waitlist-email" className="mb-2.5 block text-[13px] text-[#a9adb4]">
        Être prévenu de l’ouverture
      </label>
      <div className="flex items-center gap-3 border-b border-white/25 transition-colors duration-200 focus-within:border-[#f4f4f5]">
        <input
          id="waitlist-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="Votre adresse e-mail"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === 'error') setStatus('idle');
          }}
          disabled={status === 'loading'}
          aria-invalid={status === 'error'}
          className="min-w-0 flex-1 bg-transparent py-[13px] text-[16px] text-[#f4f4f5] placeholder:text-[#5c6068] focus:outline-none disabled:opacity-60 sm:text-[17px]"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="group inline-flex min-h-[44px] shrink-0 items-center gap-2 text-[15px] font-semibold text-[#f4f4f5] transition-opacity duration-200 hover:opacity-80 focus-visible:underline focus-visible:outline-none disabled:opacity-60"
        >
          {status === 'loading' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Envoi…</span>
            </>
          ) : (
            <>
              <span>M’inscrire</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </div>

      <p
        className="mt-2 min-h-[1.25rem] text-[13px]"
        aria-live="polite"
        role={status === 'error' ? 'alert' : undefined}
      >
        {status === 'error' && <span className="text-[#ff8f80]">{message}</span>}
      </p>
    </form>
  );
}

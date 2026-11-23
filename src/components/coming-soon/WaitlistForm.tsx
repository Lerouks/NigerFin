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
        className="nfi-merci flex items-center gap-2 border-b border-white/25 py-[14px] text-[15px] font-medium text-[#f4f4f5] sm:justify-center"
        role="status"
        aria-live="polite"
      >
        <Check className="nfi-coche h-4 w-4 shrink-0" />
        Merci, c’est noté. Vous serez prévenu à l’ouverture.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label htmlFor="waitlist-email" className="mb-2 block text-[clamp(14px,3.6vw,15.5px)] text-[#a9adb4] transition-colors duration-200 sm:mb-2.5 sm:text-center sm:text-[14px] xl:text-[13px]">
        Être prévenu de l’ouverture
      </label>
      {/* Téléphone : champ encadré et vrai bouton blanc, sur toute la largeur.
          À partir de la tablette : la ligne fine du site, champ et bouton côte à côte. */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3 sm:border-b sm:border-white/25 sm:transition-colors sm:duration-200 sm:focus-within:border-[#f4f4f5]">
        <input
          id="waitlist-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="send"
          placeholder="Votre adresse e-mail"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === 'error') setStatus('idle');
          }}
          disabled={status === 'loading'}
          aria-invalid={status === 'error'}
          className="h-[clamp(48px,12.6vw,56px)] min-w-0 flex-none rounded-[10px] border border-white/20 bg-transparent px-4 text-[clamp(16px,4.1vw,17px)] text-[#f4f4f5] transition-colors duration-200 placeholder:text-[#6b6f76] focus:border-[#f4f4f5] focus:outline-none disabled:opacity-60 sm:h-auto sm:flex-1 sm:rounded-none sm:border-0 sm:px-0 sm:py-[13px] sm:text-[17px] sm:placeholder:text-[#5c6068]"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="group inline-flex h-[clamp(48px,12.6vw,56px)] w-full shrink-0 items-center justify-center gap-2 rounded-[10px] bg-[#f4f4f5] text-[clamp(16px,4.1vw,17px)] font-semibold text-[#0b0b0c] transition-colors duration-200 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4f4f5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090a] active:bg-[#dcdfe3] disabled:opacity-60 sm:h-auto sm:min-h-[44px] sm:w-auto sm:rounded-none sm:bg-transparent sm:text-[15px] sm:text-[#f4f4f5] sm:hover:bg-transparent sm:hover:opacity-80 sm:focus-visible:underline sm:focus-visible:ring-0 sm:active:bg-transparent"
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

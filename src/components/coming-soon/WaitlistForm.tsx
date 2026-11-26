'use client';

import { useState } from 'react';
import { Loader2, Check } from 'lucide-react';

type Status = 'idle' | 'loading' | 'success' | 'error';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  // L'adresse était déjà sur la liste : rien n'a été envoyé, on le dit.
  const [dejaInscrite, setDejaInscrite] = useState(false);

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
        const corps = (await res.json().catch(() => null)) as
          | { isNew?: unknown; reactivated?: unknown }
          | null;
        setDejaInscrite(corps?.isNew === false && corps?.reactivated === false);
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
        className="nfi-merci flex min-h-[52px] items-center 2xl:min-h-[60px] 2xl:text-[17px] justify-center gap-2 rounded-[8px] border border-[#3a3d42] px-4 py-2 text-[15px] font-medium text-[#f4f4f5]"
        role="status"
        aria-live="polite"
      >
        <Check className="nfi-coche h-4 w-4 shrink-0" />
        {dejaInscrite ? (
          // Trop long pour une ligne : une phrase par ligne, la coche reste collée au texte.
          <span>
            <span className="block">Cette adresse est déjà inscrite.</span>
            <span className="block">Vous serez prévenu à l’ouverture.</span>
          </span>
        ) : (
          'Merci, c’est noté. Vous serez prévenu à l’ouverture.'
        )}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label htmlFor="waitlist-email" className="mb-[7px] block text-[13.5px] text-[#a9adb4] md:text-[14px] 2xl:mb-2 2xl:text-[16px]">
        Être prévenu de l’ouverture
      </label>
      {/* Un seul cadre : le champ et le bouton blanc côte à côte, sur tous les écrans. */}
      <div className="flex h-[52px] items-center rounded-[8px] border border-[#3a3d42] p-1 transition-colors duration-200 focus-within:border-[#f4f4f5] 2xl:h-[60px] [@media(max-height:640px)]:h-12">
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
          className="h-full min-w-0 flex-1 border-0 bg-transparent pl-[11px] pr-2.5 text-left text-[16px] text-[#f4f4f5] placeholder:text-[#6b6f76] focus:outline-none disabled:opacity-60 max-[350px]:pl-[9px] 2xl:pl-[14px] 2xl:text-[18px]"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="inline-flex h-full shrink-0 items-center justify-center gap-2 rounded-[5px] bg-[#f4f4f5] px-4 text-[15.5px] font-semibold text-[#0b0b0c] transition-colors duration-200 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4f4f5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090a] active:bg-[#dcdfe3] disabled:opacity-60 max-[350px]:px-3 max-[350px]:text-[15px] 2xl:px-5 2xl:text-[17px]"
        >
          {status === 'loading' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Envoi…</span>
            </>
          ) : (
            'M’inscrire'
          )}
        </button>
      </div>

      {/* Vide, la ligne d'erreur ne prend aucune place : la page tient dans l'écran. */}
      <p className="text-[13px] [&:not(:empty)]:mt-2" aria-live="polite" role={status === 'error' ? 'alert' : undefined}>
        {status === 'error' && <span className="text-[#ff8f80]">{message}</span>}
      </p>
    </form>
  );
}

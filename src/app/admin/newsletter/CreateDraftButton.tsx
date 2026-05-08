'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export function CreateDraftButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/newsletter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audience: 'premium', subject: 'Nouveau numéro' }),
        });
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { error?: string };
          setError(j.error ?? 'Échec de création');
          return;
        }
        const data = (await res.json()) as { id: string };
        router.push(`/admin/newsletter/${data.id}/edit`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="rounded-md bg-gold px-4 py-2 text-sm font-semibold text-primary transition hover:bg-gold/90 disabled:opacity-50"
      >
        {pending ? 'Création…' : '+ Nouveau numéro'}
      </button>
      {error ? <p className="text-xs text-red-200">{error}</p> : null}
    </div>
  );
}

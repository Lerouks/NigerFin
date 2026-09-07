'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { envoiAdmin } from '@/app/admin/lib/appel-admin';

interface BrouillonCree {
  id?: string;
  slug?: string;
  number?: number;
}

export function CreateDraftButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      // Une création n'est jamais rejouée toute seule : deux clics sur un réseau
      // qui coupe créeraient deux numéros. envoiAdmin ne rejoue pas les envois.
      const resultat = await envoiAdmin<BrouillonCree>('/api/admin/newsletter', 'POST', {
        audience: 'premium',
        subject: 'Nouveau numéro',
      });

      if (!resultat.ok) {
        // On n'affirme « rien n'a été créé » que si on en est sûr. Quand la
        // connexion tombe ou que le serveur ne répond plus (statut 0), la
        // demande a très bien pu aboutir : dire le contraire ferait recliquer
        // l'admin et créerait un second numéro.
        const incertain = resultat.statut === 0 && !resultat.rienEnvoye;
        setError(
          incertain
            ? `${resultat.cause ?? resultat.message} Le numéro a peut-être été créé : rechargez la page pour vérifier avant de recommencer.`
            : `Le numéro n'a pas été créé. ${resultat.message}`,
        );
        return;
      }

      const brouillon = resultat.donnees;
      if (!brouillon?.id) {
        setError(
          "Le serveur n'a pas confirmé la création. Rechargez la page pour vérifier si le numéro existe avant de recommencer.",
        );
        return;
      }

      router.push(`/admin/newsletter/${brouillon.id}/edit`);
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
      {error ? (
        <p role="alert" className="max-w-xs text-right text-xs leading-relaxed text-red-200">
          {error}
        </p>
      ) : null}
    </div>
  );
}

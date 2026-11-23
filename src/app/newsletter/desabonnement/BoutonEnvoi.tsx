'use client';

import { useFormStatus } from 'react-dom';

/**
 * Bouton d'un formulaire de la page de désabonnement : il se bloque pendant
 * l'envoi, pour qu'un double appui ne parte pas deux fois.
 */
export function BoutonEnvoi({
  children,
  enCours,
  className,
}: {
  children: React.ReactNode;
  enCours: string;
  className: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={className}>
      {pending ? enCours : children}
    </button>
  );
}

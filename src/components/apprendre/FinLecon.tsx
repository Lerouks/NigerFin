'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { typographieFr } from '@/lib/typographie-fr';
import { useProgression } from './progression';

/**
 * Bas de leçon. Pour un lecteur connecté, la leçon se coche toute seule quand
 * il en atteint la fin (aucun bouton à penser à cliquer). Pour un visiteur,
 * une phrase l'invite à créer un compte pour garder sa progression.
 */
export function FinLecon({ leconId, chemin }: { leconId: string; chemin: string }) {
  const { connecte, chargement, lues, enregistrer } = useProgression();
  const repere = useRef<HTMLDivElement>(null);
  const envoye = useRef(false);

  useEffect(() => {
    if (!connecte || lues.has(leconId) || envoye.current) return;
    const cible = repere.current;
    if (!cible || typeof IntersectionObserver === 'undefined') return;
    const observateur = new IntersectionObserver(
      (entrees) => {
        if (entrees.some((e) => e.isIntersecting) && !envoye.current) {
          envoye.current = true;
          void enregistrer(leconId, { lue: true });
          observateur.disconnect();
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    );
    observateur.observe(cible);
    return () => observateur.disconnect();
  }, [connecte, lues, leconId, enregistrer]);

  return (
    <div ref={repere}>
      {!chargement && !connecte && (
        <div className="mt-8 text-[14px] leading-relaxed text-gray-600">
          <p>{typographieFr('Créez un compte gratuit pour garder votre progression d’une leçon à l’autre.')}</p>
          <Link
            href={`/inscription?next=${encodeURIComponent(chemin)}`}
            className="mt-1 inline-block font-semibold text-[#111] underline underline-offset-4"
          >
            Créer un compte
          </Link>
        </div>
      )}
    </div>
  );
}

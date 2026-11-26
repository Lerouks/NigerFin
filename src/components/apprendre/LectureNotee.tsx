'use client';

import { useEffect, useRef } from 'react';
import { useProgression } from './progression';

/**
 * Pour un lecteur connecté, une leçon se coche toute seule quand il en atteint
 * la fin. Rien ne s'affiche. Une leçon repliée ne compte pas : son contenu est
 * masqué, ce repère n'est donc jamais visible.
 */
export function LectureNotee({ leconId }: { leconId: string }) {
  const { connecte, lues, enregistrer } = useProgression();
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

  return <div ref={repere} aria-hidden="true" />;
}

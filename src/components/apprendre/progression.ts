'use client';

import useSWR from 'swr';
import { useCallback, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';

export { leconDeDepart } from '@/lib/apprendre/lecture';

interface LigneProgression {
  lesson_id: string;
  completed_at: string | null;
  quiz_score: number | null;
}

const CLE = '/api/education/progress';

async function lire(url: string): Promise<LigneProgression[]> {
  const reponse = await fetch(url, { credentials: 'include' });
  if (!reponse.ok) return [];
  const donnees: unknown = await reponse.json();
  return Array.isArray(donnees) ? (donnees as LigneProgression[]) : [];
}

/**
 * La progression du lecteur connecté : les leçons lues jusqu'au bout. Un
 * visiteur n'a pas de progression (aucun appel n'est fait). Partagée par tous
 * les composants d'une page grâce au cache de SWR.
 */
export function useProgression() {
  const { isSignedIn, isLoading } = useAuth();
  const { data, mutate } = useSWR<LigneProgression[]>(isSignedIn ? CLE : null, lire, {
    revalidateOnFocus: false,
    dedupingInterval: 30_000,
  });

  const lues = useMemo(
    () => new Set((data ?? []).filter((l) => l.completed_at).map((l) => l.lesson_id)),
    [data],
  );

  const enregistrer = useCallback(
    async (leconId: string, champs: { lue?: boolean; score?: number }) => {
      if (!isSignedIn) return;
      const corps: Record<string, unknown> = { lesson_id: leconId };
      if (champs.lue !== undefined) corps.completed = champs.lue;
      if (champs.score !== undefined) corps.quiz_score = champs.score;
      const reponse = await fetch(CLE, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corps),
      });
      if (reponse.ok) await mutate();
    },
    [isSignedIn, mutate],
  );

  return { connecte: isSignedIn, chargement: isLoading, lues, enregistrer };
}

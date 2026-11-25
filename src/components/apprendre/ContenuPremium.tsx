'use client';

import Link from 'next/link';
import useSWR from 'swr';
import type { ReactNode } from 'react';
import { useAuth } from '@/lib/auth-context';
import type { Question } from '@/lib/apprendre/quiz';
import { lireQuiz } from '@/lib/apprendre/quiz';
import { typographieFr } from '@/lib/typographie-fr';
import { CorpsLecon } from './CorpsLecon';
import { QuestionLecon } from './QuestionLecon';

interface Reponse {
  corps: string;
  quiz: Question[];
}

async function charger(url: string): Promise<Reponse | null> {
  const r = await fetch(url, { credentials: 'include' });
  if (!r.ok) return null;
  const d = (await r.json()) as { corps?: unknown; quiz?: unknown };
  return typeof d.corps === 'string' ? { corps: d.corps, quiz: lireQuiz(d.quiz) } : null;
}

/**
 * Leçon Premium. Tout le monde lit son début (rendu par le serveur, lu par
 * Google) ; un abonné ou l'administration reçoit ensuite la suite et la
 * question de fin. Les autres voient l'invitation à s'abonner.
 */
export function ContenuPremium({ leconId, chemin, apercu }: { leconId: string; chemin: string; apercu: ReactNode }) {
  const { isSignedIn, isLoading } = useAuth();
  const { data, isLoading: chargement } = useSWR<Reponse | null>(
    isSignedIn ? `/api/apprendre/lecons/${leconId}` : null,
    charger,
    { revalidateOnFocus: false },
  );

  if (data) {
    return (
      <>
        <CorpsLecon markdown={data.corps} />
        <QuestionLecon questions={data.quiz} leconId={leconId} />
      </>
    );
  }

  const attente = isLoading || (isSignedIn && chargement);
  return (
    <>
      <div className="relative">
        {apercu}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-background to-transparent" aria-hidden="true" />
      </div>
      {!attente && (
        <aside className="mt-2 rounded-[14px] bg-[#111] p-6 text-white sm:p-8" aria-label="Leçon Premium">
          <p className="text-[13px] text-white/55">Leçon Premium</p>
          <p className="mt-2 max-w-[30ch] text-[21px] sm:text-[24px] font-bold leading-[1.25] tracking-[-0.015em] text-balance">
            {typographieFr('La suite est réservée aux abonnés Premium.')}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/premium"
              className="inline-flex items-center rounded-lg bg-white px-5 py-3 text-[15px] font-semibold text-[#111] transition-colors hover:bg-white/90"
            >
              Découvrir Premium
            </Link>
            {!isSignedIn && (
              <Link
                href={`/connexion?next=${encodeURIComponent(chemin)}`}
                className="inline-flex items-center rounded-lg border border-white/25 px-5 py-3 text-[15px] font-semibold text-white transition-colors hover:border-white/50"
              >
                Se connecter
              </Link>
            )}
          </div>
        </aside>
      )}
    </>
  );
}

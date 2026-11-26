'use client';

import Link from 'next/link';
import useSWR from 'swr';
import type { ReactNode } from 'react';
import { useAuth } from '@/lib/auth-context';
import type { Question } from '@/lib/apprendre/quiz';
import { lireQuiz } from '@/lib/apprendre/quiz';
import { typographieFr } from '@/lib/typographie-fr';
import { CorpsCourt } from './CorpsCourt';
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
 * Leçon Premium. Tout le monde lit sa phrase d'entrée (rendue par le serveur) ;
 * un abonné ou l'administration reçoit ensuite les trois idées et la question.
 * Les autres voient l'invitation à s'abonner, sobre, sans bloc noir (Raouf,
 * 26/11/2026 : « ça doit être sobre »).
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
        <CorpsCourt corps={data.corps} />
        <QuestionLecon questions={data.quiz} leconId={leconId} />
      </>
    );
  }

  const attente = isLoading || (isSignedIn && chargement);
  return (
    <>
      {apercu && (
        <div className="relative mt-6">
          {apercu}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-background to-transparent" aria-hidden="true" />
        </div>
      )}
      {!attente && (
        <aside className="mt-6 border-t border-black/12 pt-5" aria-label="Leçon Premium">
          <p className="max-w-[30ch] text-balance text-[17px] font-semibold leading-[1.35] text-[#111] sm:text-[18px]">
            {typographieFr('La suite de cette leçon est réservée aux abonnés Premium.')}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link
              href="/premium"
              className="inline-flex h-11 items-center rounded-[10px] border-[1.5px] border-[#111] px-5 text-[15px] font-semibold text-[#111] transition-colors hover:bg-[#111] hover:text-white"
            >
              Découvrir Premium
            </Link>
            {!isSignedIn && (
              <Link
                href={`/connexion?next=${encodeURIComponent(chemin)}`}
                className="inline-flex min-h-[44px] items-center text-[15px] font-semibold text-[#111] underline underline-offset-4"
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

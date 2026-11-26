'use client';

import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { phrases } from '@/lib/apprendre/lecture';
import type { Question } from '@/lib/apprendre/quiz';
import { scoreQuiz } from '@/lib/apprendre/quiz';
import { typographieFr } from '@/lib/typographie-fr';
import { useProgression } from './progression';

const LETTRES = ['A', 'B', 'C', 'D'];

/**
 * « Vérifiez-vous » : la question de fin d'une leçon. Une réponse se donne une
 * fois ; la bonne réponse et l'explication s'affichent aussitôt. Pour un
 * lecteur connecté, le score est gardé avec sa progression.
 */
export function QuestionLecon({ questions, leconId }: { questions: Question[]; leconId: string }) {
  const { enregistrer } = useProgression();
  const [reponses, setReponses] = useState<(number | null)[]>(() => questions.map(() => null));

  if (questions.length === 0) return null;

  const repondre = (iQuestion: number, choix: number) => {
    if (reponses[iQuestion] !== null) return;
    const suivantes = reponses.map((r, i) => (i === iQuestion ? choix : r));
    setReponses(suivantes);
    if (suivantes.every((r) => r !== null)) {
      void enregistrer(leconId, { score: scoreQuiz(questions, suivantes as number[]) });
    }
  };

  return (
    <section aria-labelledby="verifiez-vous" className="mt-8 border-t border-black/12 pt-7">
      <h2 id="verifiez-vous" className="text-[14px] font-bold text-[#111]">
        Vérifiez-vous
      </h2>
      {questions.map((q, iq) => {
        const choisie = reponses[iq] ?? null;
        const repondu = choisie !== null;
        const juste = repondu && choisie === q.bonne;
        return (
          <div key={q.question} className={iq > 0 ? 'mt-8 border-t border-black/8 pt-7' : 'mt-3'}>
            {questions.length > 1 && (
              <p className="text-[13px] text-gray-500">
                Question {iq + 1} sur {questions.length}
              </p>
            )}
            <div id={`question-${iq}`} className="mt-1 text-[18px] max-[359px]:text-[17px] sm:text-[19px] font-semibold leading-[1.45] tracking-[-0.01em] text-[#111]">
              {phrases(q.question).map((phrase) => (
                <p key={phrase}>{typographieFr(phrase)}</p>
              ))}
            </div>
            <div role="radiogroup" aria-labelledby={`question-${iq}`} className="mt-4 grid gap-2.5">
              {q.choix.map((choix, ic) => {
                const estChoisi = choisie === ic;
                const estBonne = ic === q.bonne;
                const montrerJuste = repondu && estBonne;
                const montrerFaux = repondu && estChoisi && !estBonne;
                return (
                  <button
                    key={choix}
                    type="button"
                    role="radio"
                    aria-checked={estChoisi}
                    disabled={repondu}
                    onClick={() => repondre(iq, ic)}
                    className={[
                      // La colonne de l'icône n'existe qu'après la réponse : avant, le texte prend toute la place.
                      `grid ${repondu ? 'grid-cols-[30px_minmax(0,1fr)_22px]' : 'grid-cols-[30px_minmax(0,1fr)]'} items-center gap-2.5 min-[360px]:gap-3 rounded-[10px] border-[1.5px] bg-white px-3 min-[360px]:px-4 py-3 min-h-[56px] text-left text-[16.5px] max-[359px]:text-[15px] leading-[1.45] transition-colors`,
                      montrerJuste
                        ? 'border-[#111] shadow-[inset_0_0_0_1px_#111] text-[#111]'
                        : montrerFaux
                          ? 'border-black/25 text-gray-500'
                          : repondu
                            ? 'border-black/10 text-gray-400'
                            : 'border-black/12 text-[#111] hover:border-black/40 cursor-pointer',
                    ].join(' ')}
                  >
                    <span
                      className={`grid h-7 w-7 place-items-center rounded-full border-[1.5px] text-[13px] font-bold ${
                        montrerJuste ? 'border-[#111] bg-[#111] text-white' : 'border-black/20 text-gray-600'
                      }`}
                      aria-hidden="true"
                    >
                      {LETTRES[ic]}
                    </span>
                    <span>{typographieFr(choix)}</span>
                    {repondu && (
                      <span aria-hidden="true">
                        {montrerJuste && <Check className="h-5 w-5 text-[#15803d]" strokeWidth={2.5} />}
                        {montrerFaux && <X className="h-5 w-5 text-[#b91c1c]" strokeWidth={2.5} />}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 min-h-[1px] text-[15px] leading-relaxed text-gray-700" aria-live="polite">
              {repondu && (
                <>
                  <p className={`font-bold ${juste ? 'text-[#15803d]' : 'text-[#b91c1c]'}`}>
                    {juste ? 'Bonne réponse.' : `La bonne réponse était la ${LETTRES[q.bonne]}.`}
                  </p>
                  <p>{typographieFr(q.explication)}</p>
                </>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}

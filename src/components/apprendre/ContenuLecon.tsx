import type { LeconDuCours } from '@/lib/apprendre/donnees';
import { typographieFr } from '@/lib/typographie-fr';
import { AjusteurLignes } from './AjusteurLignes';
import { ContenuPremium } from './ContenuPremium';
import { CorpsCourt } from './CorpsCourt';
import { CorpsLecon } from './CorpsLecon';
import { LectureNotee } from './LectureNotee';
import { QuestionLecon } from './QuestionLecon';

/**
 * Ce qu'une leçon montre une fois ouverte dans la page de son cours : sa
 * phrase d'entrée, ses trois idées, sa phrase de fin et sa question. Rendu par
 * le serveur, pour que Google lise les leçons gratuites même repliées.
 */
export function ContenuLecon({ lecon, chemin }: { lecon: LeconDuCours; chemin: string }) {
  return (
    <AjusteurLignes>
      {lecon.chapeau && (
        <p className="max-w-[40em] text-[18.5px] leading-[1.5] text-[#111] sm:text-[20px] lg:text-[21px]">{typographieFr(lecon.chapeau)}</p>
      )}
      {lecon.premium ? (
        <ContenuPremium leconId={lecon.id} chemin={chemin} apercu={lecon.apercu ? <CorpsLecon markdown={lecon.apercu} /> : null} />
      ) : (
        <>
          {lecon.corps && <CorpsCourt corps={lecon.corps} />}
          <QuestionLecon questions={lecon.quiz} leconId={lecon.id} />
        </>
      )}
      <LectureNotee leconId={lecon.id} />
    </AjusteurLignes>
  );
}

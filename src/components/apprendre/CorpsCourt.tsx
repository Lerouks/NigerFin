import { decouperIdees } from '@/lib/apprendre/lecture';
import { typographieFr } from '@/lib/typographie-fr';
import { CorpsLecon } from './CorpsLecon';

/**
 * Le corps d'une leçon d'une minute (format choisi par Raouf le 26/11/2026) :
 * trois idées, chacune sa phrase en gras puis son explication, côte à côte sur
 * ordinateur et l'une sous l'autre sur téléphone, puis la phrase de fin. Un
 * corps écrit dans un autre format est rendu tel quel. Sans état ni effet :
 * rendu par le serveur (leçon gratuite) comme dans le navigateur (Premium).
 */
export function CorpsCourt({ corps }: { corps: string }) {
  const lecon = decouperIdees(corps);
  if (!lecon) return <CorpsLecon markdown={corps} />;
  return (
    <>
      <ol className="mt-6 grid gap-[18px] lg:mt-[30px] lg:grid-cols-3 lg:gap-9">
        {lecon.idees.map((idee, k) => (
          <li key={idee.titre} className="border-t border-[#111] pt-3.5">
            <span className="block text-[13px] font-bold text-[#111]" aria-hidden="true">
              {k + 1}
            </span>
            <p className="mt-2.5 text-[16.5px] font-semibold leading-[1.35] text-[#111] lg:text-[17px]">{typographieFr(idee.titre)}</p>
            <p className="mt-1.5 text-[16px] leading-[1.6] text-gray-600">{typographieFr(idee.texte)}</p>
          </li>
        ))}
      </ol>
      {lecon.fin && (
        <p className="mt-[22px] max-w-[44em] text-[16px] leading-[1.6] text-[#111] sm:text-[17px] lg:mt-7">{typographieFr(lecon.fin)}</p>
      )}
    </>
  );
}

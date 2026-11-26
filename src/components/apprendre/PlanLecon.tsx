import { ChevronDown } from 'lucide-react';
import { slugifier } from '@/lib/apprendre/lecture';
import { typographieFr } from '@/lib/typographie-fr';

/**
 * Les ancres des parties d'une leçon, calculées comme rehype-lecon nomme ses
 * intertitres (même fonction, mêmes doublons en « -2 »).
 */
export function ancresDesParties(parties: string[]): string[] {
  const vues = new Set<string>();
  return parties.map((p) => {
    let ancre = slugifier(p.replace(/[*_`]/g, '')) || 'section';
    while (vues.has(ancre)) ancre += '-2';
    vues.add(ancre);
    return ancre;
  });
}

function Liste({ parties, liens }: { parties: string[]; liens: boolean }) {
  const ancres = ancresDesParties(parties);
  return (
    <ol>
      {parties.map((partie, i) => {
        const contenu = (
          <>
            <span className="text-gray-400 tabular-nums">{i + 1}</span>
            <span>{typographieFr(partie)}</span>
          </>
        );
        const classe = 'grid grid-cols-[22px_minmax(0,1fr)] items-start gap-1 py-1.5 text-[13.5px] leading-[1.4] text-gray-600 lg:py-1.5 max-lg:min-h-[44px] max-lg:items-center max-lg:grid-cols-[26px_minmax(0,1fr)] max-lg:text-[15px]';
        return (
          <li key={ancres[i]}>
            {liens ? (
              <a href={`#${ancres[i]}`} className={`${classe} hover:text-[#111]`}>
                {contenu}
              </a>
            ) : (
              <span className={classe}>{contenu}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** Sur ordinateur, dans la marge : « Dans cette leçon » et ses parties. */
export function PlanLecon({ parties, liens }: { parties: string[]; liens: boolean }) {
  if (parties.length === 0) return null;
  return (
    <nav aria-label="Dans cette leçon">
      <p className="mb-2 text-[13px] font-semibold text-[#111]">Dans cette leçon</p>
      <Liste parties={parties} liens={liens} />
    </nav>
  );
}

/** Sur téléphone et tablette, sous la date : le même plan, replié. */
export function PlanLeconReplie({ parties, liens }: { parties: string[]; liens: boolean }) {
  if (parties.length === 0) return null;
  return (
    <details className="group mt-5 rounded-xl border border-black/12 bg-white lg:hidden">
      <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between px-4 text-[15px] font-semibold text-[#111] [&::-webkit-details-marker]:hidden">
        Dans cette leçon
        <span className="inline-flex items-center gap-1.5 font-normal text-gray-500 tabular-nums">
          {parties.length}&nbsp;parties
          <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden="true" />
        </span>
      </summary>
      <div className="border-t border-black/8 px-4 py-1.5">
        <Liste parties={parties} liens={liens} />
      </div>
    </details>
  );
}

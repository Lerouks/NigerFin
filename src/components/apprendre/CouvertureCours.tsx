import type { Cours } from '@/lib/apprendre/donnees';
import { typographieFr } from '@/lib/typographie-fr';
import { figureDuTheme } from './FiguresThemes';
import { IconeTheme } from './icones';

/**
 * La couverture d'un cours (maquette « Le livre », choisie par Raouf le
 * 26/11/2026) : l'icône du thème en haut, comme au damier ; la figure tirée de
 * ses leçons, avec sa source ; le titre. Portrait sur ordinateur, plus basse
 * sur téléphone pour que le bouton « Commencer » reste dans le premier écran.
 */
export function CouvertureCours({ cours }: { cours: Cours }) {
  const figure = figureDuTheme(cours.slug);
  return (
    <div className="flex flex-col overflow-hidden rounded-[14px] bg-[#111] p-5 pb-6 text-white sm:p-7 lg:aspect-[4/5] lg:p-[26px] lg:pb-[30px] xl:px-7">
      <IconeTheme nom={cours.icone} className="h-6 w-6 sm:h-7 sm:w-7" />
      {figure ? (
        <figure className="flex min-h-0 flex-1 flex-col justify-center pb-2 pt-3 sm:pb-3 sm:pt-5 lg:pt-[18px] [&_svg]:max-h-[150px] sm:[&_svg]:max-h-[250px] lg:[&_svg]:max-h-none">
          {figure.figure}
          <figcaption className="mt-2 text-[11.5px] leading-[1.45] text-white/50 sm:mt-3 sm:text-[12px]">
            <span className="sr-only">{typographieFr(figure.legende)} </span>
            {typographieFr(`Source : ${figure.source}`)}
          </figcaption>
        </figure>
      ) : (
        <div className="min-h-[72px] flex-1" aria-hidden="true" />
      )}
      <h1 className="text-[31px] font-bold leading-[1.02] tracking-[-0.04em] text-balance sm:text-[34px] xl:text-[40px]">
        {typographieFr(cours.titre)}
      </h1>
      <p className="mt-2.5 hidden text-[14px] text-white/60 tabular-nums sm:block">
        {cours.lecons.length}&nbsp;leçon{cours.lecons.length > 1 ? 's' : ''} · {cours.minutes}&nbsp;min
      </p>
    </div>
  );
}

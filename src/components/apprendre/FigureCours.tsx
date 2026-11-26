import { typographieFr } from '@/lib/typographie-fr';
import { figureDuTheme } from './FiguresThemes';

/**
 * La figure d'un cours, sobre (Raouf, 26/11/2026 : plus de carré noir, « ça
 * doit être sobre ») : le chiffre tiré de ses leçons dessiné en noir et gris
 * directement sur la page, sous un filet, avec sa source. Rien pour un thème
 * qui n'a pas encore sa figure.
 */
export function FigureCours({ slug }: { slug: string }) {
  const figure = figureDuTheme(slug);
  if (!figure) return null;
  return (
    <figure className="border-t border-black/12 pt-4 [&_svg]:max-h-[200px] sm:[&_svg]:max-h-[260px] lg:[&_svg]:max-h-none">
      {figure.figure}
      <figcaption className="mt-3 text-[12.5px] leading-[1.5] text-gray-500">
        <span className="sr-only">{typographieFr(figure.legende)} </span>
        {typographieFr(`Source : ${figure.source}`)}
      </figcaption>
    </figure>
  );
}

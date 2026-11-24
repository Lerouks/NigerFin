import { Fragment } from 'react';
import { paragrapheFr } from '@/lib/typographie-fr';

/**
 * Paragraphe soudé (paragrapheFr) pour les blocs justifiés avec césure
 * (`.texte-justifie`, hyphens: auto). La césure coupe un mot même à l'intérieur
 * d'un groupe soudé par des insécables (« Nous y sui-vons », vu le 24/11/2026) :
 * chaque groupe soudé passe donc dans un span sans retour à la ligne. Les autres
 * mots gardent leur césure, et une insécable s'étire comme une espace dans un
 * texte justifié (mesuré dans Chrome et Safari).
 */
export function TexteSoude({ texte, longueurMax }: { texte: string; longueurMax?: number }) {
  const morceaux = paragrapheFr(texte, longueurMax).split(' ');
  return (
    <>
      {morceaux.map((morceau, i) => (
        <Fragment key={i}>
          {i > 0 ? ' ' : null}
          {/[\u00a0\u202f]/.test(morceau) ? <span className="whitespace-nowrap">{morceau}</span> : morceau}
        </Fragment>
      ))}
    </>
  );
}

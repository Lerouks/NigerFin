import { CARTE_ATLAS } from './carte-atlas';
import { NomsDesVilles } from './NomsDesVilles';

const [X0, Y0, X1, Y1] = CARTE_ATLAS.cadre;

/**
 * Le Niger de la page d'attente, dessiné comme une carte de journal : frontière
 * en trait argenté, fleuve Niger, chefs-lieux. Aucun effet, aucune animation
 * (choix de Raouf, 26/11/2026 : l'ancienne carte en points lumineux « faisait
 * trop IA »).
 *
 * Le pays tient toujours entier dans la place que lui laisse la page (viewBox en
 * « meet »), et rien n'est dessiné autour : aucun trait ne sort de l'écran. Les
 * traits gardent la même épaisseur à toutes les tailles. Les noms des villes,
 * eux, gardent une taille fixe à l'écran : ils sont posés par NomsDesVilles une
 * fois la taille de la carte connue.
 */
export function CarteAtlas({ className = '' }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`} aria-hidden="true">
      <svg
        viewBox={`${X0} ${Y0} ${X1 - X0} ${Y1 - Y0}`}
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 block h-full w-full"
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
        focusable="false"
      >
        <path d={CARTE_ATLAS.niger} fill="#121315" stroke="#c3c6cc" strokeWidth={1.3} vectorEffect="non-scaling-stroke" />
        <path d={CARTE_ATLAS.fleuve} stroke="#7c818a" strokeWidth={1.7} vectorEffect="non-scaling-stroke" />
      </svg>
      <NomsDesVilles />
    </div>
  );
}

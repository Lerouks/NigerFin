import { CARTE_NIGER } from '@/components/coming-soon/carte-niger';

/**
 * Le Niger en points, comme sur la page Niger, avec le siège d'une entreprise
 * allumé (fiches entreprises, direction « Dans la famille Niger » choisie par
 * Raouf le 25/11/2026). Rendu côté serveur, sans script. Quand le siège n'est
 * pas à Niamey, Niamey garde son nom pour qu'on se repère.
 */

const { largeur, hauteur, pas, lignes, villes } = CARTE_NIGER;

/** Points du pays, décodés une fois. */
const POINTS: { x: number; y: number }[] = [];
lignes.forEach((plages, rang) => {
  for (let i = 0; i < plages.length; i += 2) {
    for (let colonne = plages[i]!; colonne <= plages[i + 1]!; colonne += 1) {
      POINTS.push({ x: pas / 2 + colonne * pas, y: pas / 2 + rang * pas });
    }
  }
});

const sansAccent = (texte: string) =>
  texte.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

/** La ville du siège si la carte la connaît (chefs-lieux de région et Arlit). */
export function villeSurLaCarte(ville: string | null | undefined) {
  if (!ville) return null;
  return villes.find((v) => sansAccent(v.nom) === sansAccent(ville)) ?? null;
}

const pourcentX = (x: number) => `${((x / largeur) * 100).toFixed(2)}%`;
const pourcentY = (y: number) => `${((y / hauteur) * 100).toFixed(2)}%`;

export function CarteSiege({ ville, entreprise }: { ville: string; entreprise: string }) {
  const siege = villeSurLaCarte(ville);
  if (!siege) return null;
  const niamey = villes.find((v) => v.nom === 'Niamey')!;
  // Vers l'est du pays (Diffa), le nom passe à gauche du repère pour rester dans la carte.
  const nomAGauche = siege.x > largeur * 0.72;

  return (
    <div className="relative w-full" style={{ aspectRatio: `${largeur} / ${hauteur}` }}>
      <svg
        viewBox={`0 0 ${largeur} ${hauteur}`}
        className="absolute inset-0 h-full w-full"
        role="img"
        aria-label={`Carte du Niger : le siège de ${entreprise}, à ${siege.nom}`}
      >
        <g fill="#8a8e95" opacity="0.5">
          {POINTS.map((p) => (
            <circle key={`${p.x}-${p.y}`} cx={p.x} cy={p.y} r="2.7" />
          ))}
        </g>
        {villes
          .filter((v) => v.nom !== siege.nom)
          .map((v) => (
            <circle key={v.nom} cx={v.x} cy={v.y} r="5" fill="#9ca3af" />
          ))}
        {/* Le siège : un rond plein et un anneau, sans halo. */}
        <circle cx={siege.x} cy={siege.y} r="27" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="2.5" />
        <circle cx={siege.x} cy={siege.y} r="13" fill="#fff" stroke="#0b0b0c" strokeWidth="4" />
      </svg>

      {/* Noms en HTML, lisibles sur téléphone ; un léger détourage noir les détache des points. */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute whitespace-nowrap text-[14px] font-bold text-white [text-shadow:0_0_3px_#0b0b0c,0_0_3px_#0b0b0c,0_0_6px_#0b0b0c] lg:text-[15px] ${
          nomAGauche ? '-translate-x-[calc(100%+22px)] -translate-y-1/2' : 'translate-x-[22px] -translate-y-1/2 lg:translate-x-[26px]'
        }`}
        style={{ left: pourcentX(siege.x), top: pourcentY(siege.y) }}
      >
        {siege.nom}
      </span>
      {siege.nom !== 'Niamey' && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -translate-x-1/2 translate-y-[10px] whitespace-nowrap text-[12px] text-[#aeb3ba] [text-shadow:0_0_3px_#0b0b0c,0_0_3px_#0b0b0c,0_0_6px_#0b0b0c] lg:text-[13px]"
          style={{ left: pourcentX(niamey.x), top: pourcentY(niamey.y) }}
        >
          Niamey
        </span>
      )}
    </div>
  );
}

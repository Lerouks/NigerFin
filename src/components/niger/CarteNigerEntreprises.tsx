import Link from 'next/link';
import { CARTE_NIGER } from '@/components/coming-soon/carte-niger';

/**
 * Le Niger en points (la carte de la page d'attente, sans animation), avec les
 * villes et les sièges des entreprises stratégiques. Rendu côté serveur, sans
 * script : la fiche d'un repère s'ouvre au survol ou au focus (clavier,
 * toucher), et le repère mène à la liste des entreprises plus bas.
 */

export interface EntrepriseSurCarte {
  nom: string;
  slug: string;
  secteur: string;
  ville: string;
}

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

/**
 * Place des noms de ville, la même sur tous les écrans (reprise de la page
 * d'attente) : chaque nom reste DANS le pays. Écrit sous son point, « Maradi »
 * tombait au Nigeria (la ville est à 40 km de la frontière), remarqué par
 * Raouf le 24/11/2026 : Maradi et Diffa au-dessus, Zinder à droite. Dosso et
 * Tillabéri gardent leur point sans nom, pour laisser lire le repère de Niamey.
 */
const PLACE_DU_NOM: Record<string, 'droite' | 'gauche' | 'dessus' | 'dessous' | 'aucune'> = {
  Maradi: 'dessus',
  Zinder: 'droite',
  Diffa: 'dessus',
  Tahoua: 'gauche',
  Dosso: 'aucune',
  Tillabéri: 'aucune',
};

const sansAccent = (texte: string) =>
  texte.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const pourcentX = (x: number) => `${((x / largeur) * 100).toFixed(2)}%`;
const pourcentY = (y: number) => `${((y / hauteur) * 100).toFixed(2)}%`;

export function CarteNigerEntreprises({ entreprises }: { entreprises: EntrepriseSurCarte[] }) {
  // Les entreprises, regroupées par ville de siège connue de la carte.
  const groupes = villes
    .map((ville) => ({
      ville,
      liste: entreprises.filter((e) => sansAccent(e.ville) === sansAccent(ville.nom)),
    }))
    .filter((g) => g.liste.length > 0);
  const villesAvecRepere = new Set(groupes.map((g) => g.ville.nom));

  return (
    <div className="relative w-full" style={{ aspectRatio: `${largeur} / ${hauteur}` }}>
      <svg
        viewBox={`0 0 ${largeur} ${hauteur}`}
        className="absolute inset-0 h-full w-full"
        role="img"
        aria-label="Carte du Niger : villes principales et sièges des entreprises stratégiques"
      >
        <g fill="#8a8e95" opacity="0.5">
          {POINTS.map((p) => (
            <circle key={`${p.x}-${p.y}`} cx={p.x} cy={p.y} r="2.7" />
          ))}
        </g>
        {villes
          .filter((v) => !villesAvecRepere.has(v.nom))
          .map((v) => (
            <circle key={v.nom} cx={v.x} cy={v.y} r="5" fill="#9ca3af" />
          ))}
      </svg>

      {/* Noms des villes, en HTML pour rester lisibles sur téléphone. */}
      {villes
        .filter((v) => !villesAvecRepere.has(v.nom) && PLACE_DU_NOM[v.nom] !== 'aucune')
        .map((v) => {
          const place = PLACE_DU_NOM[v.nom] ?? 'droite';
          const decalage =
            place === 'gauche'
              ? '-translate-x-[calc(100%+9px)] -translate-y-1/2'
              : place === 'dessus'
                ? '-translate-x-1/2 -translate-y-[calc(100%+7px)]'
                : place === 'dessous'
                  ? '-translate-x-1/2 translate-y-[7px]'
                  : 'translate-x-[9px] -translate-y-1/2';
          return (
            <span
              key={v.nom}
              aria-hidden="true"
              className={`pointer-events-none absolute whitespace-nowrap text-[12px] sm:text-[13px] text-gray-400 ${decalage}`}
              style={{ left: pourcentX(v.x), top: pourcentY(v.y) }}
            >
              {v.nom}
            </span>
          );
        })}

      {/* Repères des sièges : un rond chiffré, le nom, et la fiche au survol. */}
      {groupes.map(({ ville, liste }) => {
        const idFiche = `fiche-${sansAccent(ville.nom)}`;
        // Sur téléphone, un nom long (« 6 sièges à Niamey ») passe sous le repère :
        // à droite, il recouvrait le point de Maradi.
        const plusieurs = liste.length > 1;
        const libelle =
          liste.length === 1 ? `${liste[0]!.nom}, ${ville.nom}` : `${liste.length}\u00a0sièges à\u00a0${ville.nom}`;
        return (
          <div
            key={ville.nom}
            className={`group absolute z-10 -translate-x-[14px] ${
              plusieurs ? '-translate-y-[14px] sm:-translate-y-1/2' : '-translate-y-1/2'
            }`}
            style={{ left: pourcentX(ville.x), top: pourcentY(ville.y) }}
          >
            <a
              href="#entreprises"
              aria-describedby={idFiche}
              className={`flex rounded-full outline-offset-4 ${
                plusieurs ? 'flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-2' : 'items-center gap-2'
              }`}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#0b0b0c] text-[12px] font-bold text-white">
                {liste.length}
              </span>
              <span className="whitespace-nowrap text-[13px] sm:text-[14px] font-semibold text-white">
                {libelle}
              </span>
            </a>
            {/* Le pb-3 transparent fait le pont entre le repère et la fiche : la
                souris la rejoint sans qu'elle se referme en chemin. */}
            <div
              id={idFiche}
              role="tooltip"
              className="invisible absolute bottom-full left-0 hidden w-64 pb-3 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 lg:block"
            >
              <ul className="space-y-1 rounded-lg bg-white p-2.5 text-[#111] shadow-[0_16px_40px_rgba(0,0,0,0.45)]">
                {liste.map((e) => (
                  <li key={e.slug}>
                    <Link
                      href={`/entreprises/${e.slug}`}
                      className="block rounded-md px-2 py-1.5 transition-colors hover:bg-black/[0.04] focus-visible:bg-black/[0.04]"
                    >
                      <span className="block text-[15px] font-semibold leading-tight">{e.nom}</span>
                      <span className="block text-[13px] text-gray-500">{e.secteur}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      })}
    </div>
  );
}

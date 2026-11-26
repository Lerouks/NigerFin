'use client';

import { useEffect, useRef, useState } from 'react';
import { CARTE_ATLAS } from './carte-atlas';

const [X0, Y0, X1, Y1] = CARTE_ATLAS.cadre;
const LARGEUR_CADRE = X1 - X0;
const HAUTEUR_CADRE = Y1 - Y0;
/** Couleur du pays sur la carte : le liseré des noms la reprend pour les détacher des traits. */
const FOND_PAYS = '#121315';

type Ancre = 'start' | 'middle' | 'end';

interface NomPlace {
  nom: string;
  /** Position du point de la ville, en pixels dans la carte. */
  px: number;
  py: number;
  /** Position du nom. */
  tx: number;
  ty: number;
  ancre: Ancre;
  capitale: boolean;
}

interface Disposition {
  largeur: number;
  hauteur: number;
  taille: number;
  noms: NomPlace[];
}

interface Boite {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

interface Place {
  tx: number;
  ty: number;
  ancre: Ancre;
  boite: Boite;
}

let contexte: CanvasRenderingContext2D | null = null;
let contour: Path2D | null = null;

/**
 * Pose les noms des villes sans qu'ils se chevauchent ni sortent du pays :
 * pour chaque ville, par ordre de priorité (Niamey d'abord), on essaie à droite,
 * au-dessus, à gauche, en dessous puis en biais, et on garde la première place
 * libre. Une ville sans place libre n'est pas dessinée du tout : un point sans
 * nom ne dit rien. Sur une petite carte, Tillabéri et Dosso, collées à Niamey,
 * sont laissées de côté ; sur une très petite carte, Niamey reste seule.
 */
function disposer(largeur: number, hauteur: number, police: string): Disposition {
  const vide = { largeur, hauteur, taille: 12, noms: [] };
  if (largeur < 60 || hauteur < 60) return vide;
  contexte ??= document.createElement('canvas').getContext('2d');
  contour ??= new Path2D(CARTE_ATLAS.niger);
  const ctx = contexte;
  if (!ctx || !contour) return vide;

  const echelle = Math.min(largeur / LARGEUR_CADRE, hauteur / HAUTEUR_CADRE);
  const ox = (largeur - LARGEUR_CADRE * echelle) / 2 - X0 * echelle;
  const oy = (hauteur - HAUTEUR_CADRE * echelle) / 2 - Y0 * echelle;
  const largeurPays = LARGEUR_CADRE * echelle;
  const petit = largeurPays < 520;
  const minuscule = largeurPays < 200;
  const taille = petit ? 12 : 13;
  const hauteurTexte = taille * 0.74;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const dansLePays = (x: number, y: number) => ctx.isPointInPath(contour as Path2D, (x - ox) / echelle, (y - oy) / echelle);

  const villes = CARTE_ATLAS.villes
    .filter((v) => !petit || (v.nom !== 'Tillabéri' && v.nom !== 'Dosso'))
    .filter((v) => !minuscule || v.nom === 'Niamey')
    .map((v) => ({ nom: v.nom, px: ox + v.x * echelle, py: oy + v.y * echelle }));
  const obstacles: Boite[] = villes.map((v) => ({ x0: v.px - 6, y0: v.py - 6, x1: v.px + 6, y1: v.py + 6 }));
  const chevauche = (b: Boite) => obstacles.some((a) => !(b.x1 < a.x0 || b.x0 > a.x1 || b.y1 < a.y0 || b.y0 > a.y1));

  const noms: NomPlace[] = [];
  for (const v of villes) {
    const capitale = v.nom === 'Niamey';
    ctx.font = `${capitale ? 600 : 450} ${taille}px ${police}`;
    const l = ctx.measureText(v.nom).width;
    const essais: [number, number, Ancre][] = [
      [v.px + 9, v.py + hauteurTexte / 2, 'start'],
      [v.px, v.py - 9, 'middle'],
      [v.px - 9, v.py + hauteurTexte / 2, 'end'],
      [v.px, v.py + hauteurTexte + 8, 'middle'],
      [v.px + 6, v.py - 7, 'start'],
      [v.px - 6, v.py - 7, 'end'],
    ];
    let choix: Place | null = null;
    let secours: Place | null = null;
    for (const [tx, ty, ancre] of essais) {
      const debut = ancre === 'start' ? tx : ancre === 'end' ? tx - l : tx - l / 2;
      const boite = { x0: debut - 2, y0: ty - hauteurTexte - 2, x1: debut + l + 2, y1: ty + 3 };
      const angles: [number, number][] = [
        [boite.x0, boite.y0],
        [boite.x1, boite.y0],
        [boite.x0, boite.y1],
        [boite.x1, boite.y1],
      ];
      const coins = angles.filter(([x, y]) => dansLePays(x, y)).length;
      const dedans = coins === 4 || (coins === 3 && dansLePays((boite.x0 + boite.x1) / 2, (boite.y0 + boite.y1) / 2));
      const libre = !chevauche(boite) && boite.x0 > 2 && boite.x1 < largeur - 2 && boite.y0 > 2 && boite.y1 < hauteur - 2;
      if (libre && dedans) {
        choix = { tx, ty, ancre, boite };
        break;
      }
      if (libre && !secours) secours = { tx, ty, ancre, boite };
    }
    if (!choix && capitale) choix = secours;
    if (!choix) continue;
    obstacles.push(choix.boite);
    noms.push({ nom: v.nom, px: v.px, py: v.py, tx: choix.tx, ty: choix.ty, ancre: choix.ancre, capitale });
  }
  return { largeur, hauteur, taille, noms };
}

/** Les chefs-lieux de la carte de la page d'attente : un point et un nom à taille fixe. */
export function NomsDesVilles() {
  const cadreRef = useRef<HTMLDivElement>(null);
  const [disposition, setDisposition] = useState<Disposition | null>(null);

  useEffect(() => {
    const cadre = cadreRef.current;
    if (!cadre) return;
    const police = getComputedStyle(document.documentElement).getPropertyValue('--font-inter').trim() || 'system-ui, sans-serif';
    const calculer = () => setDisposition(disposer(cadre.clientWidth, cadre.clientHeight, police));
    const redimension = new ResizeObserver(calculer);
    redimension.observe(cadre);
    // Les largeurs des noms dépendent de la police, qui peut arriver après le premier calcul.
    document.fonts?.ready.then(calculer).catch(() => {});
    return () => redimension.disconnect();
  }, []);

  return (
    <div ref={cadreRef} className="absolute inset-0">
      {disposition && disposition.noms.length > 0 && (
        <svg
          width={disposition.largeur}
          height={disposition.hauteur}
          viewBox={`0 0 ${disposition.largeur} ${disposition.hauteur}`}
          className="absolute inset-0 block"
          focusable="false"
        >
          {disposition.noms.map((n) =>
            n.capitale ? (
              <g key={`point-${n.nom}`}>
                <circle cx={n.px} cy={n.py} r={5.2} fill={FOND_PAYS} stroke="#f4f4f5" strokeWidth={1.3} />
                <circle cx={n.px} cy={n.py} r={2.2} fill="#f4f4f5" />
              </g>
            ) : (
              <circle key={`point-${n.nom}`} cx={n.px} cy={n.py} r={2.6} fill="#f4f4f5" />
            ),
          )}
          {disposition.noms.map((n) => (
            <text
              key={`nom-${n.nom}`}
              x={n.tx}
              y={n.ty}
              textAnchor={n.ancre}
              fontSize={disposition.taille}
              fontWeight={n.capitale ? 600 : 450}
              fill={n.capitale ? '#f4f4f5' : '#a9adb4'}
              stroke={FOND_PAYS}
              strokeWidth={4}
              strokeLinejoin="round"
              paintOrder="stroke"
            >
              {n.nom}
            </text>
          ))}
        </svg>
      )}
    </div>
  );
}

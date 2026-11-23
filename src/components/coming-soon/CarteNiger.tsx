'use client';

import { useEffect, useRef } from 'react';
import { CARTE_NIGER } from './carte-niger';

/** Durée d'un passage de la lumière d'ouest en est. */
const PERIODE_BALAYAGE_MS = 9_000;
/** Durée de l'onde qui part de Niamey. */
const PERIODE_ONDE_MS = 3_200;
/** 30 images par seconde suffisent et ménagent les téléphones. */
const INTERVALLE_IMAGE_MS = 33;
/**
 * À l'ouverture, le pays s'assemble : chaque point part d'un léger désordre et
 * rejoint sa place, d'ouest en est (décalage de traversée), en se rendant net.
 */
const ASSEMBLAGE_TRAVERSEE_MS = 1_100;
const ASSEMBLAGE_DUREE_MS = 1_050;
/** Puis les villes se posent une à une, d'ouest en est, avec une onde brève. */
const VILLES_DEBUT_MS = 1_150;
const VILLES_TRAVERSEE_MS = 1_000;
const VILLE_POSE_MS = 480;
/** Pause entre l'assemblage et le premier balayage de lumière. */
const PAUSE_AVANT_BALAYAGE_MS = 700;
/** Rayon de la lueur qui suit la souris (ordinateur seulement), en pixels. */
const RAYON_LUEUR = 80;

/** 0 → 1 en douceur (début et fin ralentis). */
function adoucir(v: number) {
  const c = Math.min(1, Math.max(0, v));
  return c * c * (3 - 2 * c);
}

/** 0 → 1 avec un très léger dépassement, pour la pose des villes. */
function poser(v: number) {
  const c = Math.min(1, Math.max(0, v));
  const k = 1.70158;
  return 1 + (k + 1) * Math.pow(c - 1, 3) + k * Math.pow(c - 1, 2);
}

const FOND = '#09090a';

/** Place des noms de ville sur petit écran (par défaut : à droite du point). */
const POSITION_PETIT_ECRAN: Record<string, 'dessus' | 'dessous' | 'gauche'> = {
  Maradi: 'dessous',
  Zinder: 'dessus',
  Diffa: 'dessus',
  Tahoua: 'gauche',
};

interface Point {
  x: number;
  y: number;
  /** Scintillement propre au point, tiré de son rang (rendu identique d'une visite à l'autre). */
  phase: number;
  /** Écart de départ de l'assemblage, sur la toile de référence (même tirage déterministe). */
  dx: number;
  dy: number;
}

/** Points de la carte, décodés une fois, sur la toile de référence. */
const POINTS: Point[] = (() => {
  const { pas, lignes } = CARTE_NIGER;
  const points: Point[] = [];
  lignes.forEach((plages, rang) => {
    const y = pas / 2 + rang * pas;
    for (let i = 0; i + 1 < plages.length; i += 2) {
      const debut = plages[i] ?? 0;
      const fin = plages[i + 1] ?? -1;
      for (let colonne = debut; colonne <= fin; colonne++) {
        const rang1 = (((points.length * 2654435761) >>> 0) % 1000) / 1000;
        const rang2 = ((((points.length + 17) * 2246822519) >>> 0) % 1000) / 1000;
        const phase = rang1 * Math.PI * 2;
        const angle = rang2 * Math.PI * 2;
        const ecart = 28 + rang1 * 110;
        points.push({ x: pas / 2 + colonne * pas, y, phase, dx: Math.cos(angle) * ecart, dy: Math.sin(angle) * ecart });
      }
    }
  });
  return points;
})();

/**
 * Le Niger dessiné en points argentés, avec les chefs-lieux. À l'ouverture, le
 * pays s'assemble et les villes se posent ; ensuite une lumière balaie le pays
 * d'ouest en est, Niamey émet une onde lente et, sur ordinateur, la souris
 * éclaire les points qu'elle survole. Toile 2D légère : aucune image à
 * télécharger, animation arrêtée hors de l'écran et pour les lecteurs qui
 * demandent moins de mouvement.
 *
 * `ajuster` : la toile remplit son parent (taille fixée par la mise en page) et la
 * carte s'y inscrit sans déformation, centrée en hauteur, calée à droite (ou au
 * centre avec `centrer`). La carte prend ainsi la place que laissent le titre et
 * le formulaire, sur téléphone comme sur ordinateur.
 */
export function CarteNiger({ className, ajuster = false, centrer = false }: { className?: string; ajuster?: boolean; centrer?: boolean }) {
  const toileRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const toile = toileRef.current;
    const ctx = toile?.getContext('2d');
    if (!toile || !ctx) return;

    const calme = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const police = getComputedStyle(document.documentElement).getPropertyValue('--font-inter').trim() || 'system-ui, sans-serif';
    const niamey = CARTE_NIGER.villes.find((v) => v.nom === 'Niamey');
    let largeur = 0;
    let hauteur = 0;
    let echelle = 1;
    let ratio = 1;
    // Décalage de la carte dans la toile (mode « ajuster ») : calée à droite, centrée en hauteur.
    let ox = 0;
    let oy = 0;
    let visible = true;
    let image = 0;
    let derniere = -Infinity;
    let debut = -1;
    // Lueur de la souris : seulement avec une vraie souris, jamais au doigt.
    const avecSouris = !calme && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    let souris: { x: number; y: number } | null = null;
    function suivreSouris(evenement: PointerEvent) {
      if (!toile) return;
      const cadre = toile.getBoundingClientRect();
      souris = { x: evenement.clientX - cadre.left, y: evenement.clientY - cadre.top };
    }
    function oublierSouris() {
      souris = null;
    }

    function mesurer() {
      if (!toile) return;
      const cadre = toile.getBoundingClientRect();
      ratio = Math.min(window.devicePixelRatio || 1, 2);
      largeur = cadre.width;
      hauteur = cadre.height;
      echelle = ajuster ? Math.min(largeur / CARTE_NIGER.largeur, hauteur / CARTE_NIGER.hauteur) : largeur / CARTE_NIGER.largeur;
      ox = ajuster ? (largeur - CARTE_NIGER.largeur * echelle) * (centrer ? 0.5 : 1) : 0;
      oy = ajuster ? (hauteur - CARTE_NIGER.hauteur * echelle) / 2 : 0;
      toile.width = Math.round(largeur * ratio);
      toile.height = Math.round(hauteur * ratio);
    }

    function dessiner(t: number) {
      if (!ctx || largeur === 0) return;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.clearRect(0, 0, largeur, hauteur);

      if (debut < 0) debut = t;
      const ecoule = calme ? Infinity : t - debut;
      const finAssemblage = ASSEMBLAGE_TRAVERSEE_MS + ASSEMBLAGE_DUREE_MS;
      // Avancée de l'assemblage d'un point selon sa position d'ouest en est (0 → 1).
      const assemble = (x01: number) => (calme ? 1 : adoucir((ecoule - x01 * ASSEMBLAGE_TRAVERSEE_MS) / ASSEMBLAGE_DUREE_MS));
      const balayage = ecoule - finAssemblage - PAUSE_AVANT_BALAYAGE_MS;
      // Position de la lumière, de -0,25 à 1,25 de la largeur : elle accompagne
      // l'assemblage, s'efface, puis balaie lentement ; hors champ si calme.
      const lumiere = calme
        ? -1
        : ecoule < finAssemblage
          ? ecoule / (ASSEMBLAGE_TRAVERSEE_MS + 300)
          : balayage < 0
            ? -1
            : ((balayage % PERIODE_BALAYAGE_MS) / PERIODE_BALAYAGE_MS) * 1.5 - 0.25;
      const cote = Math.max(1.4, 2.8 * echelle);
      const rayon2 = RAYON_LUEUR * RAYON_LUEUR;
      for (const point of POINTS) {
        const x01 = point.x / CARTE_NIGER.largeur;
        const p = assemble(x01);
        if (p <= 0) continue;
        // Arrivée en douceur : l'écart de départ fond à mesure que le point se pose.
        const reste = Math.pow(1 - p, 3);
        const px = ox + (point.x + point.dx * reste) * echelle;
        const py = oy + (point.y + point.dy * reste) * echelle;
        const ecart = (x01 - lumiere) / 0.09;
        const eclat = Math.exp(-ecart * ecart);
        const scintille = calme ? 0 : 0.06 * Math.sin(t / 1400 + point.phase);
        let lueur = 0;
        if (souris) {
          const ddx = px - souris.x;
          const ddy = py - souris.y;
          lueur = Math.exp(-(ddx * ddx + ddy * ddy) / rayon2);
        }
        // Le point reste visible pendant son trajet : on voit le pays se former.
        const alpha = Math.min(1, (0.17 + scintille + 0.72 * eclat + 0.62 * lueur) * (0.35 + 0.65 * p) + 0.25 * (1 - p) * Math.min(1, p * 6));
        ctx.fillStyle = `rgba(214,217,222,${alpha.toFixed(3)})`;
        ctx.fillRect(px - cote / 2, py - cote / 2, cote, cote);
      }

      ctx.font = `500 ${Math.max(11, Math.round(15 * echelle))}px ${police}`;
      ctx.lineJoin = 'round';
      // Sur un petit écran, Tillabéri et Dosso, collées à Niamey, chevaucheraient
      // son nom : on ne garde que les villes qu'on peut lire.
      const petit = CARTE_NIGER.largeur * echelle < 520;
      const villes = petit ? CARTE_NIGER.villes.filter((v) => v.nom !== 'Tillabéri' && v.nom !== 'Dosso') : CARTE_NIGER.villes;
      for (const ville of villes) {
        const x01 = ville.x / CARTE_NIGER.largeur;
        const depart = VILLES_DEBUT_MS + x01 * VILLES_TRAVERSEE_MS;
        const pose = calme ? 1 : (ecoule - depart) / VILLE_POSE_MS;
        if (pose <= 0) continue;
        const x = ox + ville.x * echelle;
        const y = oy + ville.y * echelle;
        const rayonPoint = Math.max(2.2, 3.2 * echelle);
        // Le point se pose avec un très léger rebond, suivi d'une onde brève.
        ctx.fillStyle = '#f4f4f5';
        ctx.beginPath();
        ctx.arc(x, y, rayonPoint * poser(pose), 0, Math.PI * 2);
        ctx.fill();
        if (!calme && pose < 1.8) {
          const onde = Math.min(1, pose / 1.8);
          ctx.strokeStyle = `rgba(244,244,245,${(0.5 * (1 - onde)).toFixed(3)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x, y, rayonPoint + onde * 16 * Math.max(echelle, 0.7), 0, Math.PI * 2);
          ctx.stroke();
        }
        // Le nom suit, en fondu ; il s'éclaire au passage de la lumière ou de la souris.
        const apparition = calme ? 1 : adoucir((ecoule - depart - 220) / 420);
        if (apparition <= 0) continue;
        const ecart = (x01 - lumiere) / 0.08;
        let eclat = Math.exp(-ecart * ecart);
        if (souris) {
          const ddx = x - souris.x;
          const ddy = y - souris.y;
          eclat = Math.max(eclat, Math.exp(-(ddx * ddx + ddy * ddy) / rayon2));
        }
        const opacite = (ville.nom === 'Niamey' ? 0.92 : 0.3 + 0.68 * eclat) * apparition;
        ctx.lineWidth = 5;
        ctx.strokeStyle = FOND;
        ctx.globalAlpha = apparition;
        // Sur petit écran, Maradi, Zinder et Diffa sont trop proches pour avoir
        // tous leur nom à droite : certains passent au-dessus ou au-dessous.
        const position = petit ? POSITION_PETIT_ECRAN[ville.nom] : undefined;
        const largeurNom = ctx.measureText(ville.nom).width;
        const tx = position === 'gauche' ? x - largeurNom - 9 : position ? x - largeurNom / 2 : x + 9;
        const ty = position === 'dessus' ? y - 9 : position === 'dessous' ? y + 17 : y + 4;
        ctx.strokeText(ville.nom, tx, ty);
        ctx.globalAlpha = 1;
        ctx.fillStyle = `rgba(244,244,245,${opacite.toFixed(3)})`;
        ctx.fillText(ville.nom, tx, ty);
      }
      ctx.globalAlpha = 1;

      const niameyPosee = niamey ? (ecoule - VILLES_DEBUT_MS - (niamey.x / CARTE_NIGER.largeur) * VILLES_TRAVERSEE_MS) / VILLE_POSE_MS >= 1.8 : false;
      if (!calme && niamey && niameyPosee) {
        const avance = (t % PERIODE_ONDE_MS) / PERIODE_ONDE_MS;
        ctx.strokeStyle = `rgba(244,244,245,${(0.55 * (1 - avance)).toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(ox + niamey.x * echelle, oy + niamey.y * echelle, 4 + avance * 34 * Math.max(echelle, 0.6), 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    function boucle(t: number) {
      image = 0;
      if (!visible) return;
      if (t - derniere >= INTERVALLE_IMAGE_MS) {
        dessiner(t);
        derniere = t;
      }
      image = requestAnimationFrame(boucle);
    }

    function relancer() {
      if (calme) {
        dessiner(0);
      } else if (visible && !image) {
        image = requestAnimationFrame(boucle);
      }
    }

    const redimension = new ResizeObserver(() => {
      mesurer();
      dessiner(performance.now());
    });
    redimension.observe(toile);

    // Hors de l'écran (sous le formulaire sur téléphone), on ne dessine plus.
    const presence = new IntersectionObserver((entrees) => {
      visible = entrees.some((entree) => entree.isIntersecting);
      relancer();
    });
    presence.observe(toile);

    if (avecSouris) {
      window.addEventListener('pointermove', suivreSouris, { passive: true });
      document.documentElement.addEventListener('pointerleave', oublierSouris);
    }

    mesurer();
    // La police de la page peut arriver après le premier dessin.
    document.fonts?.ready.then(() => dessiner(performance.now())).catch(() => {});
    relancer();

    return () => {
      redimension.disconnect();
      presence.disconnect();
      if (avecSouris) {
        window.removeEventListener('pointermove', suivreSouris);
        document.documentElement.removeEventListener('pointerleave', oublierSouris);
      }
      if (image) cancelAnimationFrame(image);
    };
  }, [ajuster, centrer]);

  return (
    <canvas
      ref={toileRef}
      aria-hidden="true"
      className={className}
      style={ajuster ? undefined : { aspectRatio: `${CARTE_NIGER.largeur} / ${CARTE_NIGER.hauteur}` }}
    />
  );
}

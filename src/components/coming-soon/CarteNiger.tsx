'use client';

import { useEffect, useRef } from 'react';
import { CARTE_NIGER } from './carte-niger';

/** Durée d'un passage de la lumière d'ouest en est. */
const PERIODE_BALAYAGE_MS = 9_000;
/** Durée de l'onde qui part de Niamey. */
const PERIODE_ONDE_MS = 3_200;
/** 30 images par seconde suffisent et ménagent les téléphones. */
const INTERVALLE_IMAGE_MS = 33;

const FOND = '#09090a';

interface Point {
  x: number;
  y: number;
  /** Scintillement propre au point, tiré de son rang (rendu identique d'une visite à l'autre). */
  phase: number;
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
        const phase = ((((points.length * 2654435761) >>> 0) % 1000) / 1000) * Math.PI * 2;
        points.push({ x: pas / 2 + colonne * pas, y, phase });
      }
    }
  });
  return points;
})();

/**
 * Le Niger dessiné en points argentés, avec les chefs-lieux. Une lumière
 * balaie le pays d'ouest en est et Niamey émet une onde lente. Toile 2D
 * légère : aucune image à télécharger, animation arrêtée hors de l'écran et
 * pour les lecteurs qui demandent moins de mouvement.
 */
export function CarteNiger({ className }: { className?: string }) {
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
    let visible = true;
    let image = 0;
    let derniere = -Infinity;

    function mesurer() {
      if (!toile) return;
      const cadre = toile.getBoundingClientRect();
      ratio = Math.min(window.devicePixelRatio || 1, 2);
      largeur = cadre.width;
      hauteur = cadre.height;
      echelle = largeur / CARTE_NIGER.largeur;
      toile.width = Math.round(largeur * ratio);
      toile.height = Math.round(hauteur * ratio);
    }

    function dessiner(t: number) {
      if (!ctx || largeur === 0) return;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.clearRect(0, 0, largeur, hauteur);

      // Position de la lumière, de -0,25 à 1,25 de la largeur ; hors champ si calme.
      const lumiere = calme ? -1 : ((t % PERIODE_BALAYAGE_MS) / PERIODE_BALAYAGE_MS) * 1.5 - 0.25;
      const cote = Math.max(1.1, 2.8 * echelle);
      for (const point of POINTS) {
        const ecart = (point.x / CARTE_NIGER.largeur - lumiere) / 0.09;
        const eclat = Math.exp(-ecart * ecart);
        const scintille = calme ? 0 : 0.06 * Math.sin(t / 1400 + point.phase);
        ctx.fillStyle = `rgba(214,217,222,${(0.17 + scintille + 0.72 * eclat).toFixed(3)})`;
        ctx.fillRect(point.x * echelle - cote / 2, point.y * echelle - cote / 2, cote, cote);
      }

      ctx.font = `500 ${Math.max(10, Math.round(15 * echelle))}px ${police}`;
      ctx.lineJoin = 'round';
      for (const ville of CARTE_NIGER.villes) {
        const ecart = (ville.x / CARTE_NIGER.largeur - lumiere) / 0.08;
        const eclat = Math.exp(-ecart * ecart);
        const x = ville.x * echelle;
        const y = ville.y * echelle;
        ctx.fillStyle = '#f4f4f5';
        ctx.beginPath();
        ctx.arc(x, y, Math.max(2.2, 3.2 * echelle), 0, Math.PI * 2);
        ctx.fill();
        const opacite = ville.nom === 'Niamey' ? 0.92 : 0.3 + 0.68 * eclat;
        ctx.lineWidth = 5;
        ctx.strokeStyle = FOND;
        ctx.strokeText(ville.nom, x + 9, y + 4);
        ctx.fillStyle = `rgba(244,244,245,${opacite.toFixed(3)})`;
        ctx.fillText(ville.nom, x + 9, y + 4);
      }

      if (!calme && niamey) {
        const avance = (t % PERIODE_ONDE_MS) / PERIODE_ONDE_MS;
        ctx.strokeStyle = `rgba(244,244,245,${(0.55 * (1 - avance)).toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(niamey.x * echelle, niamey.y * echelle, 4 + avance * 34 * Math.max(echelle, 0.6), 0, Math.PI * 2);
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

    mesurer();
    // La police de la page peut arriver après le premier dessin.
    document.fonts?.ready.then(() => dessiner(performance.now())).catch(() => {});
    relancer();

    return () => {
      redimension.disconnect();
      presence.disconnect();
      if (image) cancelAnimationFrame(image);
    };
  }, []);

  return <canvas ref={toileRef} aria-hidden="true" className={className} />;
}

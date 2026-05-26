'use client';

import { useState } from 'react';
import Image from 'next/image';

/**
 * Carte du Niger custom (PNG haute resolution dans public/carte-niger.png)
 * avec layer interactif transparent superpose : hover/tap sur une ville
 * affiche un tooltip Apple-style.
 *
 * Les positions x/y des villes sont calibrees visuellement en pourcentage
 * de l'image source 1536x1024. Si la carte source change, recalibrer.
 */

interface City {
  name: string;
  /** position horizontale en % de la largeur (0-100) */
  x: number;
  /** position verticale en % de la hauteur (0-100) */
  y: number;
  role: string;
  capital?: boolean;
}

const CITIES: City[] = [
  { name: 'Niamey', x: 17, y: 71, role: 'Capitale du Niger', capital: true },
  { name: 'Tillabéri', x: 13, y: 56, role: 'Chef-lieu de la région de Tillabéri' },
  { name: 'Tahoua', x: 34, y: 52, role: 'Chef-lieu de la région de Tahoua' },
  { name: 'Agadez', x: 56, y: 35, role: "Chef-lieu de la région d'Agadez" },
  { name: 'Maradi', x: 51, y: 66, role: 'Chef-lieu de la région de Maradi' },
  { name: 'Zinder', x: 63, y: 70, role: 'Chef-lieu de la région de Zinder' },
  { name: 'Diffa', x: 81, y: 63, role: 'Chef-lieu de la région de Diffa' },
];

interface NigerMapInteractiveProps {
  className?: string;
}

export function NigerMapInteractive({ className }: NigerMapInteractiveProps) {
  const [activeCity, setActiveCity] = useState<City | null>(null);

  return (
    <div className={`relative w-full ${className ?? ''}`}>
      <div className="relative aspect-3/2 w-full">
        <Image
          src="/carte-niger.webp"
          alt="Carte du Niger avec ses 7 principales villes : Niamey (capitale), Tillabéri, Tahoua, Agadez, Maradi, Zinder, Diffa"
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1200px"
          quality={85}
          className="object-contain select-none pointer-events-none"
          style={{ mixBlendMode: 'darken' }}
        />

        {/* Layer interactif au-dessus de l'image : 1 hit-area par ville */}
        <div className="absolute inset-0 z-10">
          {CITIES.map((c) => (
            <button
              key={c.name}
              type="button"
              onMouseEnter={() => setActiveCity(c)}
              onMouseLeave={() =>
                setActiveCity((curr) => (curr?.name === c.name ? null : curr))
              }
              onFocus={() => setActiveCity(c)}
              onBlur={() =>
                setActiveCity((curr) => (curr?.name === c.name ? null : curr))
              }
              onClick={() => setActiveCity((curr) => (curr?.name === c.name ? null : c))}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#d4a843] focus-visible:ring-offset-2"
              style={{ left: `${c.x}%`, top: `${c.y}%`, width: '44px', height: '44px' }}
              aria-label={`${c.name}, ${c.role}`}
            />
          ))}

          {/* Tooltip rendu au-dessus de la ville active */}
          {activeCity && <Tooltip city={activeCity} />}
        </div>
      </div>
    </div>
  );
}

function Tooltip({ city }: { city: City }) {
  // Le tooltip se positionne au-dessus du marqueur. Sur le bord superieur
  // (capitale Niamey en haut a 71%), on retourne le tooltip vers le bas
  // pour qu'il ne sorte pas du container.
  const flipBelow = city.y < 25;
  return (
    <div
      role="tooltip"
      className="absolute pointer-events-none -translate-x-1/2 z-10"
      style={{
        left: `${city.x}%`,
        top: flipBelow ? `${city.y}%` : `${city.y}%`,
        transform: flipBelow
          ? 'translate(-50%, 32px)'
          : 'translate(-50%, calc(-100% - 32px))',
      }}
    >
      <div className="relative bg-white rounded-xl shadow-[0_8px_30px_-8px_rgba(15,23,42,0.25)] ring-1 ring-black/6 px-3.5 py-2.5 min-w-[160px] animate-fade-in-up">
        <p className="text-[13px] font-bold text-[#111] leading-tight">{city.name}</p>
        <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{city.role}</p>
        {/* Petite flèche du tooltip */}
        <div
          className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-white rotate-45 ring-1 ring-black/6 ${
            flipBelow ? '-top-1 ring-l-0 ring-t-0' : '-bottom-1 ring-r-0 ring-b-0'
          }`}
        />
      </div>
    </div>
  );
}

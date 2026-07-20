'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { getSectorAnchor } from '@/lib/sector-anchor';

interface SectorTOCProps {
  sectors: string[];
}

/**
 * Sommaire sectoriel sticky horizontal (desktop seulement, scroll-x mobile).
 * Smooth scroll natif vers les sections + active highlight via IntersectionObserver.
 * Monochrome strict, separateurs verticaux discrets, pas de couleur sectorielle.
 */
export function SectorTOC({ sectors }: SectorTOCProps) {
  const [activeSector, setActiveSector] = useState<string | null>(null);
  const barreRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const id = visible.target.id;
          const sector = sectors.find((s) => getSectorAnchor(s) === id);
          if (sector) setActiveSector(sector);
        }
      },
      { rootMargin: '-30% 0% -60% 0%', threshold: [0, 0.2, 0.5, 1] }
    );

    sectors.forEach((sector) => {
      const el = document.getElementById(getSectorAnchor(sector));
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sectors]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, sector: string) => {
      e.preventDefault();
      const el = document.getElementById(getSectorAnchor(sector));
      if (el) {
        // Hauteur REELLE du header, lue dans la variable CSS unique, plus la
        // hauteur de ce sommaire lui-meme, qui est colle juste en dessous.
        // L'ancienne valeur de 80 px etait une approximation qui ne correspondait
        // ni au header mobile (64 px) ni au header desktop (120 px) : le titre
        // vise se retrouvait masque ou trop bas selon la largeur d'ecran.
        const hauteurHeader =
          parseInt(
            getComputedStyle(document.documentElement).getPropertyValue('--header-height'),
            10,
          ) || 64;
        const hauteurSommaire = barreRef.current?.offsetHeight ?? 0;
        const top =
          el.getBoundingClientRect().top + window.scrollY - hauteurHeader - hauteurSommaire - 8;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    },
    []
  );

  if (sectors.length === 0) return null;

  return (
    <nav
      ref={barreRef}
      aria-label="Sommaire par secteur"
      className="relative md:sticky md:top-[var(--header-height)] z-30 bg-background/95 backdrop-blur-md border-b border-black/8"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ul className="flex items-center gap-0 overflow-x-auto py-3 -mx-1 scrollbar-thin scroll-smooth">
          <li className="shrink-0 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-gray-600 font-semibold border-r border-black/10">
            Secteurs
          </li>
          {sectors.map((sector, idx) => {
            const isActive = activeSector === sector;
            return (
              <li
                key={sector}
                className={
                  'shrink-0 ' +
                  (idx < sectors.length - 1 ? 'border-r border-black/8' : '')
                }
              >
                <a
                  href={`#${getSectorAnchor(sector)}`}
                  onClick={(e) => handleClick(e, sector)}
                  className={
                    'block px-4 py-1 text-[13px] font-medium transition-colors ' +
                    (isActive
                      ? 'text-foreground'
                      : 'text-gray-500 hover:text-foreground')
                  }
                  aria-current={isActive ? 'true' : undefined}
                >
                  {sector}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

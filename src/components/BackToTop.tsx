'use client';

import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

interface BackToTopProps {
  /** Seuil de scroll (px) au-dela duquel le bouton apparait. */
  threshold?: number;
}

/**
 * Bouton flottant "remonter en haut" : apparait quand on a scrolle assez bas
 * (lecture d'un article), ramene en haut de page en douceur. Place en bas a
 * droite, z-index sous les prompts (CookieBanner/CivilityPrompt) pour ne jamais
 * les masquer. Respecte prefers-reduced-motion pour le scroll.
 */
export function BackToTop({ threshold = 600 }: BackToTopProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  const scrollUp = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  };

  return (
    <button
      type="button"
      onClick={scrollUp}
      aria-label="Remonter en haut de la page"
      tabIndex={visible ? 0 : -1}
      className={`fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-[#111] text-white shadow-[0_8px_30px_-6px_rgba(0,0,0,0.35)] transition-all duration-300 hover:bg-[#d4a843] hover:scale-105 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#d4a843] focus-visible:ring-offset-2 ${
        visible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-3 pointer-events-none'
      }`}
    >
      <ArrowUp className="h-5 w-5" strokeWidth={2.5} aria-hidden />
    </button>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';

interface Options {
  /** Pourcentage de visibilite pour declencher (0-1) */
  threshold?: number;
  /** Marge autour du viewport */
  rootMargin?: string;
  /** Si true, ne declenche qu'une fois (pas de re-trigger sur out/in) */
  once?: boolean;
}

/**
 * Hook qui retourne un ref + un boolean visible.
 * Base sur IntersectionObserver, fallback "always visible" si non supporte.
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  options: Options = {},
): { ref: React.RefObject<T | null>; visible: boolean } {
  const { threshold = 0.15, rootMargin = '0px', once = true } = options;
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once) observer.disconnect();
          } else if (!once) {
            setVisible(false);
          }
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return { ref, visible };
}

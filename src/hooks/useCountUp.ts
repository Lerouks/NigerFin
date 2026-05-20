'use client';

import { useEffect, useRef, useState } from 'react';

interface Options {
  /** Duree de l'animation en ms */
  duration?: number;
  /** Declenche l'animation seulement quand true (pour combiner avec useInView) */
  trigger?: boolean;
  /** Nombre de decimales a preserver */
  decimals?: number;
}

/**
 * Hook qui anime un nombre de 0 (ou autre start) vers target avec
 * easing ease-out-cubic. Respecte prefers-reduced-motion (retourne
 * directement target). RAF-based, sans dependance.
 */
export function useCountUp(target: number, options: Options = {}): number {
  const { duration = 1200, trigger = true, decimals = 1 } = options;
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || !trigger) {
      setValue(target);
      return;
    }

    startTimeRef.current = performance.now();
    const factor = Math.pow(10, decimals);

    const step = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = Math.round(target * eased * factor) / factor;
      setValue(current);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, trigger, decimals]);

  return value;
}

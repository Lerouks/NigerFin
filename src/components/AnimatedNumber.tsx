'use client';

import { useCountUp } from '@/hooks/useCountUp';
import { useInView } from '@/hooks/useInView';

interface AnimatedNumberProps {
  /** Valeur cible sous forme string format francais (ex: "-7,5", "1 308", "18,8") */
  value: string;
  /** Duree animation (ms) */
  duration?: number;
  /** Classes Tailwind */
  className?: string;
}

/**
 * Affiche un nombre formatte francais qui s'anime de 0 -> target
 * quand le composant entre dans le viewport.
 * Si la valeur n'est pas un nombre parsable, fallback affichage statique.
 */
export function AnimatedNumber({ value, duration = 1200, className }: AnimatedNumberProps) {
  const { ref, visible } = useInView<HTMLSpanElement>({ threshold: 0.4 });

  // Parse "1 308,5" / "-7,5" / "33,2" -> number
  const cleaned = value.replace(/\s/g, '').replace(',', '.');
  const target = parseFloat(cleaned);
  const isNumeric = Number.isFinite(target);

  // Nb de decimales
  const decimals = (cleaned.split('.')[1] || '').length;

  const current = useCountUp(isNumeric ? target : 0, {
    duration,
    trigger: visible,
    decimals,
  });

  if (!isNumeric) {
    return <span ref={ref} className={className}>{value}</span>;
  }

  const formatter = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: true,
  });
  const display = formatter.format(current);

  return (
    <span ref={ref} className={className} aria-label={value}>
      {display}
    </span>
  );
}

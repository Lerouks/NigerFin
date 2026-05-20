'use client';

import { useInView } from '@/hooks/useInView';

interface RevealOnScrollProps {
  children: React.ReactNode;
  /** Delai avant l'anim, en ms */
  delay?: number;
  /** Classes additionnelles sur le wrapper */
  className?: string;
  /** Element HTML wrapper (par defaut div) */
  as?: 'div' | 'section' | 'article';
}

/**
 * Wrapper qui anime un fade-in-up subtil quand son enfant entre dans
 * le viewport. Une seule fois par session. Respecte prefers-reduced-motion
 * (rendu instantanement sans transition).
 */
export function RevealOnScroll({
  children,
  delay = 0,
  className = '',
  as: Tag = 'div',
}: RevealOnScrollProps) {
  const { ref, visible } = useInView<HTMLDivElement>({ threshold: 0.15 });

  return (
    <Tag
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`reveal-on-scroll ${visible ? 'reveal-visible' : ''} ${className}`}
      style={{ transitionDelay: visible && delay ? `${delay}ms` : undefined }}
    >
      {children}
    </Tag>
  );
}

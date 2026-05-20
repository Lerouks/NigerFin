'use client';

import { useEffect, useRef, useState } from 'react';

interface ReadingProgressBarProps {
  articleRef?: React.RefObject<HTMLElement | null>;
  targetId?: string;
}

export function ReadingProgressBar({ articleRef, targetId }: ReadingProgressBarProps) {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const getScrollTop = () => {
      return Math.max(
        0,
        window.pageYOffset ?? 0,
        document.documentElement?.scrollTop ?? 0,
        document.body?.scrollTop ?? 0,
      );
    };

    const resolveTarget = (): HTMLElement | null => {
      if (articleRef?.current) return articleRef.current;
      if (targetId) return document.getElementById(targetId);
      return null;
    };

    const calculate = () => {
      const article = resolveTarget();
      if (!article) return;

      const rect = article.getBoundingClientRect();
      const scrollTop = getScrollTop();
      const articleTop = rect.top + scrollTop;
      const articleHeight = article.offsetHeight;
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;

      const start = articleTop;
      const end = articleTop + articleHeight - windowHeight;

      if (end <= 0 || articleHeight <= windowHeight) {
        setProgress(100);
        return;
      }

      const raw = ((scrollTop - start) / (end - start)) * 100;
      const clamped = Math.min(100, Math.max(0, raw));
      setProgress(Math.round(clamped * 10) / 10);
    };

    const onScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(calculate);
    };

    calculate();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('touchmove', onScroll, { passive: true });
    window.addEventListener('resize', calculate, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('touchmove', onScroll);
      window.removeEventListener('resize', calculate);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [articleRef, targetId]);

  return (
    <div
      className="fixed top-0 left-0 h-[3px] bg-gradient-to-r from-[#d4a843] via-[#e5b854] to-[#d4a843] z-[9999] transition-none pointer-events-none shadow-[0_1px_8px_rgba(212,168,67,0.3)]"
      style={{
        width: `${progress}%`,
        opacity: progress > 0 ? 1 : 0,
        willChange: 'width',
      }}
      aria-hidden="true"
    />
  );
}

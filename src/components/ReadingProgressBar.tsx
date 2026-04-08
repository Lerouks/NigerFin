'use client';

import { useEffect, useRef, useState } from 'react';

export function ReadingProgressBar({ articleRef }: { articleRef: React.RefObject<HTMLElement | null> }) {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const getScrollTop = () =>
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      window.pageYOffset ||
      0;

    const calculate = () => {
      const article = articleRef.current;
      if (!article) return;
      const articleTop = article.getBoundingClientRect().top + getScrollTop();
      const articleHeight = article.offsetHeight;
      const windowHeight = window.innerHeight;
      const scrollTop = getScrollTop();
      const start = articleTop;
      const end = articleTop + articleHeight - windowHeight;
      if (end <= start) { setProgress(100); return; }
      const raw = ((scrollTop - start) / (end - start)) * 100;
      setProgress(Math.min(100, Math.max(0, Math.round(raw * 10) / 10)));
    };

    const onScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(calculate);
    };

    calculate();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', calculate, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', calculate);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [articleRef]);

  if (progress === 0) return null;

  return (
    <div
      style={{ width: `${progress}%` }}
      className="fixed top-0 left-0 h-[3px] bg-[#111] z-[9999] transition-none"
      aria-hidden="true"
    />
  );
}

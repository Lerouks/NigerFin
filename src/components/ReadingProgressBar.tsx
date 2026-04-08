'use client';

import { useState, useEffect, useCallback } from 'react';

export function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);

  const handleScroll = useCallback(() => {
    const article = document.querySelector('.article-content');
    if (!article) return;

    const rect = article.getBoundingClientRect();
    const articleTop = rect.top + window.scrollY;
    const articleHeight = article.scrollHeight;
    const windowHeight = window.innerHeight;
    const scrollable = articleHeight - windowHeight;

    if (scrollable <= 0) {
      setProgress(100);
      return;
    }

    const scrolled = window.scrollY - articleTop;
    const pct = Math.min(100, Math.max(0, (scrolled / scrollable) * 100));
    setProgress(pct);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  if (progress <= 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 h-[2px] z-[60] pointer-events-none">
      <div
        className="h-full bg-[#111] transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

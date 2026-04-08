'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const HEADER_HEIGHT = 64;
const MIN_CHANGE = 0.5;

export function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);
  const dimensionsRef = useRef({ start: 0, end: 0 });
  const lastProgressRef = useRef(0);
  const rafRef = useRef<number>(0);

  const computeDimensions = useCallback(() => {
    const el = document.querySelector('.article-content');
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const start = rect.top + window.scrollY - HEADER_HEIGHT;
    const end = start + el.scrollHeight - window.innerHeight;
    dimensionsRef.current = { start, end };
  }, []);

  const handleScroll = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const { start, end } = dimensionsRef.current;
      if (end <= start) return;

      const pct = Math.min(100, Math.max(0, ((window.scrollY - start) / (end - start)) * 100));

      if (Math.abs(pct - lastProgressRef.current) >= MIN_CHANGE || pct <= 0 || pct >= 100) {
        lastProgressRef.current = pct;
        setProgress(pct);
      }
    });
  }, []);

  useEffect(() => {
    computeDimensions();
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', computeDimensions);

    const el = document.querySelector('.article-content');
    let observer: ResizeObserver | null = null;
    if (el) {
      observer = new ResizeObserver(computeDimensions);
      observer.observe(el);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', computeDimensions);
      cancelAnimationFrame(rafRef.current);
      observer?.disconnect();
    };
  }, [computeDimensions, handleScroll]);

  if (progress <= 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 h-[2px] z-[60] pointer-events-none">
      <div
        className="h-full bg-[#111]"
        style={{ width: `${progress}%`, transition: 'width 100ms linear' }}
      />
    </div>
  );
}

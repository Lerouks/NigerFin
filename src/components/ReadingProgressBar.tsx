'use client';

import { useState, useEffect, useRef } from 'react';

const HEADER_HEIGHT = 64;
const THRESHOLD = 0.5;

function getScrollY(): number {
  if (typeof window === 'undefined') return 0;
  const y = window.scrollY;
  // iOS Safari fallback
  if (y === 0 && document.documentElement.scrollTop > 0) {
    return document.documentElement.scrollTop;
  }
  return y;
}

export function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);
  const startRef = useRef(0);
  const endRef = useRef(0);
  const lastRef = useRef(0);
  const tickingRef = useRef(false);

  useEffect(() => {
    function measure() {
      // Find the h1 title as start point
      const h1 = document.querySelector('article h1') || document.querySelector('.article-content')?.closest('article')?.querySelector('h1');
      const content = document.querySelector('.article-content');
      if (!content) return;

      // Use h1 position if found, otherwise content top
      const anchor = h1 || content;
      const anchorRect = anchor.getBoundingClientRect();
      const contentRect = content.getBoundingClientRect();
      const scrollY = getScrollY();

      // Absolute positions (independent of current scroll)
      const start = anchorRect.top + scrollY - HEADER_HEIGHT;
      const contentBottom = contentRect.top + scrollY + content.scrollHeight;
      const end = contentBottom - window.innerHeight;

      startRef.current = start;
      endRef.current = Math.max(start + 1, end);
    }

    function onScroll() {
      if (tickingRef.current) return;
      tickingRef.current = true;
      requestAnimationFrame(() => {
        tickingRef.current = false;
        const s = startRef.current;
        const e = endRef.current;
        if (e <= s) return;

        const y = getScrollY();
        const pct = Math.min(100, Math.max(0, ((y - s) / (e - s)) * 100));

        if (Math.abs(pct - lastRef.current) > THRESHOLD || pct <= 0 || pct >= 100) {
          lastRef.current = pct;
          setProgress(pct);
        }
      });
    }

    // Initial measure after layout settles
    const t = setTimeout(() => { measure(); onScroll(); }, 150);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure);

    // ResizeObserver for dynamic content
    const content = document.querySelector('.article-content');
    let ro: ResizeObserver | null = null;
    if (content) {
      ro = new ResizeObserver(() => { measure(); onScroll(); });
      ro.observe(content);

      // Recalculate when images load
      content.querySelectorAll('img').forEach((img) => {
        if (!img.complete) img.addEventListener('load', () => { measure(); onScroll(); }, { once: true });
      });
    }

    return () => {
      clearTimeout(t);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', measure);
      ro?.disconnect();
    };
  }, []);

  if (progress <= 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 h-[2px] z-[60] pointer-events-none">
      <div
        className="h-full bg-[#111]"
        style={{ width: `${progress}%`, transition: 'width 80ms linear' }}
      />
    </div>
  );
}

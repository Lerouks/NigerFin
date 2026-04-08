'use client';

import { useEffect, useRef } from 'react';

const HEADER_HEIGHT = 64;
const THRESHOLD = 0.4;

export function ReadingProgressBar() {
  const barRef = useRef<HTMLDivElement>(null);
  const startRef = useRef(0);
  const endRef = useRef(0);
  const lastRef = useRef(0);
  const tickingRef = useRef(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    function getScroll(): number {
      return window.pageYOffset || document.documentElement.scrollTop || 0;
    }

    function measure() {
      const h1 = document.querySelector('article h1');
      const content = document.querySelector('.article-content');
      if (!content) return;

      const anchor = h1 || content;
      const scrollY = getScroll();
      const anchorRect = anchor.getBoundingClientRect();
      const contentRect = content.getBoundingClientRect();

      const start = anchorRect.top + scrollY - HEADER_HEIGHT;
      const contentBottom = contentRect.top + scrollY + content.scrollHeight;
      const end = contentBottom - window.innerHeight;

      startRef.current = start;
      endRef.current = Math.max(start + 1, end);
    }

    function update() {
      tickingRef.current = false;
      if (!bar) return;

      const s = startRef.current;
      const e = endRef.current;
      if (e <= s) return;

      const y = getScroll();
      const pct = Math.min(100, Math.max(0, ((y - s) / (e - s)) * 100));
      const prev = lastRef.current;

      if (Math.abs(pct - prev) < THRESHOLD && pct > 0 && pct < 100) return;

      const goingForward = pct > prev;
      lastRef.current = pct;

      // Direct DOM manipulation: no React state, no re-render
      bar.style.width = `${pct}%`;
      // Transition only when going forward, instant when going backward
      bar.style.transition = goingForward ? 'width 80ms linear' : 'none';
      // Show/hide the container
      bar.parentElement!.style.opacity = pct > 0 ? '1' : '0';
    }

    function onScroll() {
      if (tickingRef.current) return;
      tickingRef.current = true;
      requestAnimationFrame(update);
    }

    // Initial measure after layout
    const t = setTimeout(() => {
      measure();
      mountedRef.current = true;
      update();
    }, 200);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure);

    const content = document.querySelector('.article-content');
    let ro: ResizeObserver | null = null;
    if (content) {
      ro = new ResizeObserver(() => { measure(); });
      ro.observe(content);

      content.querySelectorAll('img').forEach((img) => {
        if (!img.complete) img.addEventListener('load', measure, { once: true });
      });
    }

    return () => {
      clearTimeout(t);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', measure);
      ro?.disconnect();
    };
  }, []);

  return (
    <div
      className="fixed top-0 left-0 right-0 h-[2px] z-[60] pointer-events-none"
      style={{ opacity: 0 }}
    >
      <div
        ref={barRef}
        className="h-full bg-[#111]"
        style={{ width: '0%', willChange: 'width' }}
      />
    </div>
  );
}

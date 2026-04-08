'use client';

import { useEffect, useRef } from 'react';

const HEADER_HEIGHT = 64;
const THRESHOLD = 0.4;

export function ReadingProgressBar() {
  const barRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const startRef = useRef(0);
  const endRef = useRef(0);
  const lastRef = useRef(0);
  const tickingRef = useRef(false);

  useEffect(() => {
    const bar = barRef.current!;
    const wrapper = wrapperRef.current!;
    if (!bar || !wrapper) return;

    function getScroll(): number {
      // iOS Safari compat: pageYOffset is most reliable
      return window.pageYOffset || document.documentElement.scrollTop || 0;
    }

    function measure() {
      // Target #article-main (only exists on accessible articles, not paywall)
      const article = document.getElementById('article-main');
      if (!article) {
        // No article to track (premium blocked, loading, etc.)
        wrapper.style.display = 'none';
        return;
      }
      wrapper.style.display = '';

      // Find h1 inside the article as the start anchor
      const h1 = article.querySelector('h1');
      const anchor = h1 || article;

      const scrollY = getScroll();

      // Use offsetTop for stable absolute positions (no reflow from getBoundingClientRect)
      let anchorTop = 0;
      let el: HTMLElement | null = anchor as HTMLElement;
      while (el) {
        anchorTop += el.offsetTop;
        el = el.offsetParent as HTMLElement | null;
      }

      let articleBottom = 0;
      el = article;
      while (el) {
        articleBottom += el.offsetTop;
        el = el.offsetParent as HTMLElement | null;
      }
      articleBottom += article.offsetHeight;

      const start = anchorTop - HEADER_HEIGHT;
      const end = articleBottom - window.innerHeight;

      startRef.current = start;
      endRef.current = Math.max(start + 1, end);
    }

    function update() {
      tickingRef.current = false;
      if (!bar || !wrapper) return;
      if (wrapper.style.display === 'none') return;

      const s = startRef.current;
      const e = endRef.current;
      if (e <= s) return;

      const y = getScroll();
      const pct = Math.min(100, Math.max(0, ((y - s) / (e - s)) * 100));
      const prev = lastRef.current;

      if (Math.abs(pct - prev) < THRESHOLD && pct > 0 && pct < 100) return;

      const goingForward = pct > prev;
      lastRef.current = pct;

      bar.style.width = `${pct}%`;
      bar.style.transition = goingForward ? 'width 80ms linear' : 'none';
      wrapper.style.opacity = pct > 0 ? '1' : '0';
    }

    function onScroll() {
      if (tickingRef.current) return;
      tickingRef.current = true;
      requestAnimationFrame(update);
    }

    // Measure after layout settles (images, paywall resolution)
    const t1 = setTimeout(() => { measure(); update(); }, 300);
    // Second measure for late-loading content
    const t2 = setTimeout(() => { measure(); update(); }, 2000);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure);

    // ResizeObserver on the article (content changes, images load)
    const article = document.getElementById('article-main');
    let ro: ResizeObserver | null = null;
    if (article) {
      ro = new ResizeObserver(() => { measure(); });
      ro.observe(article);

      // Also observe image loads
      article.querySelectorAll('img').forEach((img) => {
        if (!img.complete) img.addEventListener('load', measure, { once: true });
      });
    }

    // MutationObserver: detect when #article-main appears (async content load)
    const mo = new MutationObserver(() => {
      const el = document.getElementById('article-main');
      if (el && wrapper && wrapper.style.display === 'none') {
        measure();
        update();
        // Attach ResizeObserver to newly appeared article
        if (!ro) {
          ro = new ResizeObserver(() => { measure(); });
          ro.observe(el);
        }
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', measure);
      ro?.disconnect();
      mo.disconnect();
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
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

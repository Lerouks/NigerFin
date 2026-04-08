'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const HEADER_HEIGHT = 64;
const MIN_CHANGE = 0.5;

function getScrollY(): number {
  // iOS Safari compat: some versions don't support window.scrollY
  return window.scrollY ?? window.pageYOffset ?? document.documentElement.scrollTop ?? 0;
}

export function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);
  const dimensionsRef = useRef({ start: 0, end: 0 });
  const lastProgressRef = useRef(0);
  const rafRef = useRef<number>(0);

  const computeDimensions = useCallback(() => {
    const el = document.querySelector('.article-content');
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const scrollY = getScrollY();
    const start = rect.top + scrollY - HEADER_HEIGHT;
    const scrollable = el.scrollHeight - window.innerHeight;

    if (scrollable <= 0) {
      // Article shorter than viewport: 100% if visible, 0% otherwise
      dimensionsRef.current = { start, end: start + 1 };
      return;
    }

    dimensionsRef.current = { start, end: start + scrollable };
  }, []);

  const handleScroll = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const { start, end } = dimensionsRef.current;
      if (end <= start) return;

      const scrollY = getScrollY();
      const pct = Math.min(100, Math.max(0, ((scrollY - start) / (end - start)) * 100));

      if (Math.abs(pct - lastProgressRef.current) >= MIN_CHANGE || pct <= 0 || pct >= 100) {
        lastProgressRef.current = pct;
        setProgress(pct);
      }
    });
  }, []);

  useEffect(() => {
    // Initial compute after a short delay (let images/layout settle)
    const initTimeout = setTimeout(() => {
      computeDimensions();
      handleScroll();
    }, 100);

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', computeDimensions);

    const el = document.querySelector('.article-content');
    let observer: ResizeObserver | null = null;

    if (el) {
      // ResizeObserver for dynamic content (paywall, lazy content)
      observer = new ResizeObserver(() => {
        computeDimensions();
        handleScroll();
      });
      observer.observe(el);

      // Listen for image loads within article content
      const images = el.querySelectorAll('img');
      const onImageLoad = () => {
        computeDimensions();
        handleScroll();
      };
      images.forEach((img) => {
        if (!img.complete) {
          img.addEventListener('load', onImageLoad);
        }
      });

      // Recompute after all images loaded (fallback)
      if (images.length > 0) {
        setTimeout(() => {
          computeDimensions();
          handleScroll();
        }, 2000);
      }
    }

    return () => {
      clearTimeout(initTimeout);
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

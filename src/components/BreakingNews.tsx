'use client';

import { useState, useEffect } from 'react';
import { Zap, ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { FlashBannerItem } from '@/lib/site-data';

interface BreakingNewsProps {
  initialItems?: FlashBannerItem[];
  initialEnabled?: boolean;
}

export function BreakingNews({ initialItems = [], initialEnabled = false }: BreakingNewsProps) {
  const initialReady = initialEnabled && initialItems.length > 0;
  const [items] = useState<FlashBannerItem[]>(initialReady ? initialItems : []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused || items.length === 0) return;
    const id = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 5000);
    return () => clearInterval(id);
  }, [isPaused, items.length]);

  const goNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const goPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  if (!initialReady || dismissed || items.length === 0) return null;

  const item = items[currentIndex];
  if (!item) return null;

  return (
    <div
      className="bg-linear-to-r from-black via-gray-900 to-black text-white overflow-hidden relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        className="absolute bottom-0 left-0 h-[2px]"
        style={{
          background: 'linear-gradient(90deg, #b8922f, #d4a843, #e8c96a, #d4a843, #b8922f)',
          animation: 'progress 5s linear infinite',
          width: '100%',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-10 gap-3">
          <div className="flex items-center gap-1.5 shrink-0">
            <Zap className="w-3.5 h-3.5 text-gold fill-gold" />
            <span
              className="text-[11px] font-black uppercase tracking-[0.15em] text-gold"
            >
              Flash
            </span>
          </div>

          <div className="w-px h-4 bg-gray-600 shrink-0" />

          <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded-xs text-gray-300 shrink-0">
            {item.tag}
          </span>

          <div className="flex-1 overflow-hidden relative min-w-0" aria-live="polite" aria-atomic="true">
            <p key={currentIndex} className="text-xs truncate text-gray-200 animate-slide-in-right">{item.text}</p>
          </div>

          <div className="hidden sm:flex items-center gap-1 shrink-0 ml-2">
            <button onClick={goPrev} className="p-1 hover:bg-white/10 rounded-sm transition-colors" aria-label="Précédent">
              <ChevronLeft className="w-3.5 h-3.5 text-gray-500" />
            </button>
            <div className="flex items-center gap-1 mx-1">
              {items.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`rounded-full transition-all duration-300 ${
                    i === currentIndex ? 'w-4 h-1.5' : 'w-1.5 h-1.5 bg-gray-600 hover:bg-gray-500'
                  }`}
                  style={i === currentIndex ? { backgroundColor: '#d4a843' } : undefined}
                  aria-label={`Info ${i + 1}`}
                />
              ))}
            </div>
            <button onClick={goNext} className="p-1 hover:bg-white/10 rounded-sm transition-colors" aria-label="Suivant">
              <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
            </button>
          </div>

          <button
            onClick={() => setDismissed(true)}
            className="p-1 hover:bg-white/10 rounded-sm transition-colors ml-1 shrink-0"
            aria-label="Fermer"
          >
            <X className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes progress {
          from { transform: scaleX(0); transform-origin: left; }
          to { transform: scaleX(1); transform-origin: left; }
        }
      `}</style>
    </div>
  );
}

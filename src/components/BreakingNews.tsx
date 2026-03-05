'use client';

import { useState, useEffect, useRef } from 'react';
import { Zap, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface NewsItem {
  tag: string;
  text: string;
}

const fallbackItems: NewsItem[] = [
  { tag: 'MARCHÉS', text: "EUR/XOF stable à 655,957 — Le franc CFA maintient sa parité fixe avec l'euro" },
  { tag: 'BRVM', text: "L'indice composite gagne 1,01% en clôture — Hausse portée par les valeurs bancaires" },
  { tag: 'NIGER', text: 'Le secteur minier enregistre une croissance de 18% au T1 2026' },
  { tag: 'MATIÈRES', text: 'Uranium : les cours mondiaux atteignent 89,50 USD/lb, +1,42% cette semaine' },
  { tag: 'UEMOA', text: "Les échanges commerciaux intra-régionaux en hausse de 23% sur l'année" },
];

export function BreakingNews() {
  const [items, setItems] = useState<NewsItem[]>(fallbackItems);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetch('/api/admin/flash-banner')
      .then((res) => res.json())
      .then((data) => {
        if (data.enabled === false) {
          setDismissed(true);
          return;
        }
        if (data.items?.length) {
          setItems(data.items.map((n: any) => ({ tag: n.tag, text: n.text })));
        }
      })
      .catch(() => {});
  }, []);

  const startTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (!isPaused) {
        setCurrentIndex((prev) => (prev + 1) % items.length);
      }
    }, 5000);
  };

  useEffect(() => {
    startTimer();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaused, items.length]);

  const goNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
    startTimer();
  };

  const goPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
    startTimer();
  };

  if (dismissed || items.length === 0) return null;

  const item = items[currentIndex];

  return (
    <div
      className="bg-gradient-to-r from-black via-gray-900 to-black text-white overflow-hidden relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        className="absolute bottom-0 left-0 h-[2px]"
        style={{
          background: 'linear-gradient(90deg, #b8860b, #d4a843, #f5d576, #d4a843, #b8860b)',
          animation: 'progress 5s linear infinite',
          width: '100%',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-10 gap-3">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Zap className="w-3.5 h-3.5" style={{ color: '#d4a843', fill: '#d4a843' }} />
            <span
              className="text-[11px] font-black uppercase tracking-[0.15em]"
              style={{ color: '#d4a843' }}
            >
              Flash
            </span>
          </div>

          <div className="w-px h-4 bg-gray-600 flex-shrink-0" />

          <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded-sm text-gray-300 flex-shrink-0">
            {item.tag}
          </span>

          <div className="flex-1 overflow-hidden relative min-w-0">
            <p className="text-xs truncate text-gray-200">{item.text}</p>
          </div>

          <div className="hidden sm:flex items-center gap-1 flex-shrink-0 ml-2">
            <button onClick={goPrev} className="p-1 hover:bg-white/10 rounded transition-colors" aria-label="Précédent">
              <ChevronLeft className="w-3.5 h-3.5 text-gray-400" />
            </button>
            <div className="flex items-center gap-1 mx-1">
              {items.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setCurrentIndex(i);
                    startTimer();
                  }}
                  className={`rounded-full transition-all duration-300 ${
                    i === currentIndex ? 'w-4 h-1.5' : 'w-1.5 h-1.5 bg-gray-600 hover:bg-gray-500'
                  }`}
                  style={i === currentIndex ? { backgroundColor: '#d4a843' } : undefined}
                  aria-label={`Info ${i + 1}`}
                />
              ))}
            </div>
            <button onClick={goNext} className="p-1 hover:bg-white/10 rounded transition-colors" aria-label="Suivant">
              <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>

          <button
            onClick={() => setDismissed(true)}
            className="p-1 hover:bg-white/10 rounded transition-colors ml-1 flex-shrink-0"
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

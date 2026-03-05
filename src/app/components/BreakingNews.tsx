import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, ChevronLeft, ChevronRight, X } from 'lucide-react';

const breakingNewsItems = [
  {
    tag: 'MARCHÉS',
    text: 'EUR/XOF stable à 655,957 — Le franc CFA maintient sa parité fixe avec l\'euro',
  },
  {
    tag: 'BRVM',
    text: 'L\'indice composite gagne 1,01% en clôture — Hausse portée par les valeurs bancaires',
  },
  {
    tag: 'NIGER',
    text: 'Le secteur minier enregistre une croissance de 18% au T1 2026',
  },
  {
    tag: 'MATIÈRES',
    text: 'Uranium : les cours mondiaux atteignent 89,50 USD/lb, +1,42% cette semaine',
  },
  {
    tag: 'UEMOA',
    text: 'Les échanges commerciaux intra-régionaux en hausse de 23% sur l\'année',
  },
];

export function BreakingNews() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const startTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => {
      if (!isPaused) {
        setDirection(1);
        setCurrentIndex((prev) => (prev + 1) % breakingNewsItems.length);
      }
    }, 5000);
  };

  useEffect(() => {
    startTimer();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused]);

  const goNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % breakingNewsItems.length);
    startTimer();
  };

  const goPrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + breakingNewsItems.length) % breakingNewsItems.length);
    startTimer();
  };

  if (dismissed) return null;

  const item = breakingNewsItems[currentIndex];

  return (
    <div
      className="bg-gradient-to-r from-black via-gray-900 to-black text-white overflow-hidden relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Subtle animated line at bottom */}
      <motion.div
        className="absolute bottom-0 left-0 h-[2px]"
        style={{ background: 'linear-gradient(90deg, #b8860b, #d4a843, #f5d576, #d4a843, #b8860b)' }}
        initial={{ width: '0%' }}
        animate={{ width: '100%' }}
        transition={{ duration: 5, ease: 'linear', repeat: Infinity }}
        key={currentIndex}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-10 gap-3">
          {/* Flash badge */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Zap className="w-3.5 h-3.5" style={{ color: '#d4a843', fill: '#d4a843' }} />
            </motion.div>
            <span className="text-[11px] font-black uppercase tracking-[0.15em]" style={{ color: '#d4a843' }}>
              Flash
            </span>
          </div>

          <div className="w-px h-4 bg-gray-600 flex-shrink-0" />

          {/* Category tag */}
          <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded-sm text-gray-300 flex-shrink-0">
            {item.tag}
          </span>

          {/* News text with slide animation */}
          <div className="flex-1 overflow-hidden relative min-w-0">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.p
                key={currentIndex}
                custom={direction}
                initial={(d: number) => ({ x: d * 60, opacity: 0 })}
                animate={{ x: 0, opacity: 1 }}
                exit={(d: number) => ({ x: d * -60, opacity: 0 })}
                transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                className="text-xs truncate text-gray-200"
              >
                {item.text}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Navigation arrows */}
          <div className="hidden sm:flex items-center gap-1 flex-shrink-0 ml-2">
            <button
              onClick={goPrev}
              className="p-1 hover:bg-white/10 rounded transition-colors"
              aria-label="Précédent"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-gray-400" />
            </button>
            {/* Dots */}
            <div className="flex items-center gap-1 mx-1">
              {breakingNewsItems.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setDirection(i > currentIndex ? 1 : -1);
                    setCurrentIndex(i);
                    startTimer();
                  }}
                  className={`rounded-full transition-all duration-300 ${
                    i === currentIndex
                      ? 'w-4 h-1.5'
                      : 'w-1.5 h-1.5 bg-gray-600 hover:bg-gray-500'
                  }`}
                  style={i === currentIndex ? { backgroundColor: '#d4a843' } : undefined}
                  aria-label={`Info ${i + 1}`}
                />
              ))}
            </div>
            <button
              onClick={goNext}
              className="p-1 hover:bg-white/10 rounded transition-colors"
              aria-label="Suivant"
            >
              <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>

          {/* Dismiss button */}
          <button
            onClick={() => setDismissed(true)}
            className="p-1 hover:bg-white/10 rounded transition-colors ml-1 flex-shrink-0"
            aria-label="Fermer"
          >
            <X className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>
      </div>
    </div>
  );
}
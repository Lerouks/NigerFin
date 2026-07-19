/**
 * Graphe d'indice ascendant, signature de la page « Prochainement ».
 * La courbe se dessine au chargement (stroke-dashoffset), l'aire apparaît en
 * fondu, le point de tête « live » pulse dans un halo, et l'ensemble respire
 * doucement en continu. 100 % SVG + CSS (voir globals.css), zéro dépendance.
 */
const LINE =
  'M0 410 L58 398 L116 420 L182 346 L248 372 L314 286 L380 312 L446 206 L502 232 L560 126 L612 66';
const AREA = `${LINE} L612 460 L0 460 Z`;

export function IndexChart() {
  return (
    <div className="nfi-drift w-full" aria-hidden="true">
      <svg
        viewBox="0 0 624 460"
        className="h-auto w-full overflow-visible"
        fill="none"
        role="presentation"
      >
        <defs>
          <linearGradient id="nfi-area-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d4a843" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#d4a843" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="nfi-line-grad" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#c99a38" stopOpacity="0.55" />
            <stop offset="45%" stopColor="#c99a38" />
            <stop offset="100%" stopColor="#e6bd5c" />
          </linearGradient>
          <filter id="nfi-glow" x="-75%" y="-75%" width="250%" height="250%">
            <feGaussianBlur stdDeviation="9" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Aire sous la courbe */}
        <path d={AREA} fill="url(#nfi-area-fill)" className="nfi-fade" style={{ animationDelay: '1.5s' }} />

        {/* Courbe */}
        <path
          d={LINE}
          stroke="url(#nfi-line-grad)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          className="nfi-draw"
          style={{ animationDelay: '0.55s' }}
        />

        {/* Point de tête « live » + halo */}
        <g className="nfi-fade" style={{ animationDelay: '2.1s' }}>
          <circle cx="612" cy="66" r="11" fill="#d4a843" className="nfi-pulse" />
          <circle cx="612" cy="66" r="6.5" fill="#d4a843" filter="url(#nfi-glow)" />
          <circle cx="612" cy="66" r="2.8" fill="#fbf7ee" />
        </g>
      </svg>
    </div>
  );
}

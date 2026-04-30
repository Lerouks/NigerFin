import * as React from 'react';

export interface SparklineProps {
  /** Série de valeurs (typiquement 7 derniers jours). 2+ points minimum. */
  values: number[];
  width?: number;
  height?: number;
  strokeColor?: string;
  fillColor?: string;
  strokeWidth?: number;
  ariaLabel?: string;
}

/**
 * Mini graphique en courbe (~80 octets de path SVG) pour rythmer une ligne
 * de tableau. Auto-scale sur le min/max de la série, marge interne de 1 px
 * pour éviter que la ligne touche les bords.
 */
export function Sparkline({
  values,
  width = 64,
  height = 18,
  strokeColor = '#1a1a1a',
  fillColor,
  strokeWidth = 1.5,
  ariaLabel = 'Évolution sur 7 jours',
}: SparklineProps) {
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = (width - 2) / (values.length - 1);

  const points = values.map((v, i) => {
    const x = 1 + i * stepX;
    const y = 1 + (1 - (v - min) / range) * (height - 2);
    return [x, y] as const;
  });

  const linePath = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(' ');

  const areaPath = fillColor
    ? `${linePath} L${(width - 1).toFixed(1)},${(height - 1).toFixed(1)} L1,${(height - 1).toFixed(1)} Z`
    : null;

  return (
    <svg
      role="img"
      aria-label={ariaLabel}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      {areaPath ? <path d={areaPath} fill={fillColor} stroke="none" opacity={0.18} /> : null}
      <path
        d={linePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

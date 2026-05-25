'use client';

import { useState, useCallback, useRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';

interface GraphRepartitionProps {
  capital: number;
  interest: number;
  title?: string;
  capitalLabel?: string;
  interestLabel?: string;
}

const COLORS = ['#111111', '#d4d4d4'];

function fmt(n: number): string {
  return Math.round(n).toLocaleString('fr-FR');
}

export function GraphRepartition({
  capital,
  interest,
  title = 'Répartition du coût',
  capitalLabel = 'Capital',
  interestLabel = 'Intérêts',
}: GraphRepartitionProps) {
  const [activeIndex, setActiveIndex] = useState(-1);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; name: string; value: number; pct: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleEnter = useCallback((_: unknown, index: number) => {
    setActiveIndex(index);
  }, []);

  const handleLeave = useCallback(() => {
    setActiveIndex(-1);
    setTooltip(null);
  }, []);

  const handleClick = useCallback((_: unknown, index: number) => {
    setActiveIndex((prev) => (prev === index ? -1 : index));
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (activeIndex < 0 || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const total = capital + interest;
    const item = activeIndex === 0 ? { name: capitalLabel, value: capital } : { name: interestLabel, value: interest };
    const pct = ((item.value / total) * 100).toFixed(1);

    let x = e.clientX - rect.left + 12;
    let y = e.clientY - rect.top - 12;
    // Flip if too close to right edge
    if (x + 160 > rect.width) x = e.clientX - rect.left - 170;
    // Flip if too close to top
    if (y < 0) y = e.clientY - rect.top + 16;

    setTooltip({ x, y, name: item.name, value: item.value, pct });
  }, [activeIndex, capital, interest, capitalLabel, interestLabel]);

  const total = capital + interest;
  if (total <= 0) return null;

  const data = [
    { name: capitalLabel, value: capital },
    { name: interestLabel, value: interest },
  ];

  const capitalPercent = ((capital / total) * 100).toFixed(1);
  const interestPercent = ((interest / total) * 100).toFixed(1);

  // LOW-QUAL-1 : Recharts ne type pas correctement le param de activeShape
  // (signature interne). Le cast en any est volontaire et limite a ce callback.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderActive = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
      <g>
        <Sector
          cx={cx} cy={cy}
          innerRadius={innerRadius - 2}
          outerRadius={outerRadius + 5}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
      </g>
    );
  };

  const pieProps = {
    data,
    cx: '50%',
    cy: '50%',
    innerRadius: 40,
    outerRadius: 65,
    paddingAngle: 2,
    dataKey: 'value',
    stroke: 'none',
    activeIndex: activeIndex >= 0 ? activeIndex : undefined,
    activeShape: renderActive,
    onMouseEnter: handleEnter,
    onMouseLeave: handleLeave,
    onClick: handleClick,
  };

  return (
    <div
      ref={containerRef}
      className="relative bg-white border border-black/[0.06] rounded-xl p-5 sm:p-6"
      aria-label={`Graphique de répartition : ${capitalLabel} vs ${interestLabel}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { setActiveIndex(-1); setTooltip(null); }}
    >
      <h3 className="text-[11px] tracking-[0.15em] uppercase text-gray-400 mb-4">
        {title}
      </h3>

      {/* Layout: col on mobile, row on sm+ */}
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
        {/* Chart */}
        <div className="w-36 h-36 sm:w-40 sm:h-40 flex-shrink-0 cursor-pointer">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              {/* LOW-QUAL-1 : Recharts Pie types restreignent activeIndex
                  alors qu'a l'execution number ou undefined fonctionnent.
                  Cast volontaire, contenu et documente. */}
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <Pie {...pieProps as any}>
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index]}
                    opacity={activeIndex >= 0 && activeIndex !== index ? 0.3 : 1}
                    style={{ transition: 'opacity 200ms ease-out', cursor: 'pointer' }}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="w-full sm:w-auto min-w-0 space-y-2.5">
          {data.map((item, index) => {
            const pct = index === 0 ? capitalPercent : interestPercent;
            const isActive = activeIndex === index;
            const isDimmed = activeIndex >= 0 && !isActive;
            return (
              <div
                key={index}
                className={`flex items-center gap-3 cursor-pointer transition-opacity duration-200 rounded-lg px-3 py-2 -mx-3 ${
                  isActive ? 'bg-[#fafaf9]' : ''
                } ${isDimmed ? 'opacity-40' : ''}`}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(-1)}
                onClick={() => setActiveIndex((p) => p === index ? -1 : index)}
              >
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index] }} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-gray-600 truncate">{item.name}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[14px] font-semibold tabular-nums">{fmt(item.value)}</p>
                  <p className="text-[11px] text-gray-400">{pct}%</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating tooltip */}
      {tooltip && (
        <div
          className="absolute z-10 pointer-events-none bg-white border border-black/[0.08] rounded-lg shadow-lg px-3 py-2.5"
          style={{ left: tooltip.x, top: tooltip.y, minWidth: 140 }}
        >
          <p className="text-[13px] font-semibold text-[#111]">{tooltip.name}</p>
          <p className="text-[13px] text-gray-600">{fmt(tooltip.value)} FCFA</p>
          <p className="text-[11px] text-gray-400">{tooltip.pct}% du total</p>
        </div>
      )}
    </div>
  );
}

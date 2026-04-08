'use client';

import { useState, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';

interface GraphRepartitionProps {
  capital: number;
  interest: number;
  title?: string;
  capitalLabel?: string;
  interestLabel?: string;
}

const COLORS = ['#111111', '#d4d4d4'];

export function GraphRepartition({
  capital,
  interest,
  title = 'Répartition du coût',
  capitalLabel = 'Capital',
  interestLabel = 'Intérêts',
}: GraphRepartitionProps) {
  const [activeIndex, setActiveIndex] = useState(-1);

  const handleEnter = useCallback((_: unknown, index: number) => {
    setActiveIndex(index);
  }, []);

  const handleLeave = useCallback(() => {
    setActiveIndex(-1);
  }, []);

  const handleClick = useCallback((_: unknown, index: number) => {
    setActiveIndex((prev) => (prev === index ? -1 : index));
  }, []);

  const total = capital + interest;
  if (total <= 0) return null;

  const data = [
    { name: capitalLabel, value: capital },
    { name: interestLabel, value: interest },
  ];

  const capitalPercent = ((capital / total) * 100).toFixed(1);
  const interestPercent = ((interest / total) * 100).toFixed(1);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderActive = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value, percent } = props;
    return (
      <g>
        <Sector
          cx={cx} cy={cy}
          innerRadius={innerRadius - 3}
          outerRadius={outerRadius + 6}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <text x={cx} y={cy - 8} textAnchor="middle" fill="#111" fontSize={13} fontWeight={600}>
          {Number(value).toLocaleString('fr-FR')}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="#888" fontSize={11}>
          {payload.name} ({(percent * 100).toFixed(1)}%)
        </text>
      </g>
    );
  };

  // Build pie props separately to avoid TypeScript strictness on Recharts Pie
  const pieProps = {
    data,
    cx: '50%',
    cy: '50%',
    innerRadius: 45,
    outerRadius: 70,
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
      className="bg-white border border-black/[0.06] rounded-xl p-6"
      aria-label={`Graphique de répartition : ${capitalLabel} vs ${interestLabel}`}
    >
      <h3 className="text-[11px] tracking-[0.15em] uppercase text-gray-400 mb-4">
        {title}
      </h3>
      <div className="flex items-center gap-6">
        <div className="w-40 h-40 flex-shrink-0 cursor-pointer">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <Pie {...pieProps as any}>
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index]}
                    opacity={activeIndex >= 0 && activeIndex !== index ? 0.35 : 1}
                    style={{ transition: 'opacity 200ms ease-out' }}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-3">
          <div
            className={`flex items-center gap-3 cursor-pointer transition-opacity duration-200 ${activeIndex >= 0 && activeIndex !== 0 ? 'opacity-40' : ''}`}
            onMouseEnter={() => setActiveIndex(0)}
            onMouseLeave={() => setActiveIndex(-1)}
            onClick={() => setActiveIndex((p) => p === 0 ? -1 : 0)}
          >
            <div className="w-3 h-3 rounded-full bg-[#111]" />
            <div>
              <p className="text-[13px] text-gray-500">{capitalLabel}</p>
              <p className="text-[15px] font-semibold">{capitalPercent}%</p>
            </div>
          </div>
          <div
            className={`flex items-center gap-3 cursor-pointer transition-opacity duration-200 ${activeIndex >= 0 && activeIndex !== 1 ? 'opacity-40' : ''}`}
            onMouseEnter={() => setActiveIndex(1)}
            onMouseLeave={() => setActiveIndex(-1)}
            onClick={() => setActiveIndex((p) => p === 1 ? -1 : 1)}
          >
            <div className="w-3 h-3 rounded-full bg-[#d4d4d4]" />
            <div>
              <p className="text-[13px] text-gray-500">{interestLabel}</p>
              <p className="text-[15px] font-semibold">{interestPercent}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

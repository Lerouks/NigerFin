'use client';

import { useState, useCallback } from 'react';
import { X, Users, Shield, MapPin, Briefcase, Gem } from 'lucide-react';

interface Region {
  id: string;
  name: string;
  capital: string;
  population: number;
  area_km2: number;
  economic_activities: string[];
  natural_resources: string[];
  security_level: 'stable' | 'moderate' | 'elevated' | 'critical';
  security_note: string;
  description: string;
}

interface NigerMapProps {
  regions: Region[];
  filter: string;
}

const SECURITY_COLORS: Record<string, { fill: string; label: string; dot: string }> = {
  stable:   { fill: '#10b981', label: 'Stable',   dot: 'bg-emerald-500' },
  moderate: { fill: '#f59e0b', label: 'Modéré',   dot: 'bg-amber-500' },
  elevated: { fill: '#f97316', label: 'Élevé',    dot: 'bg-orange-500' },
  critical: { fill: '#ef4444', label: 'Critique',  dot: 'bg-red-500' },
};

// Geographically accurate SVG paths for Niger's 8 regions
// Coordinate system: viewBox 0 0 800 600
// x ≈ longitude × 50  (0°E → 0, 16°E → 800)
// y ≈ (23.5° - latitude) × 50  (23.5°N → 0, 11.5°N → 600)
const REGION_PATHS: Record<string, string> = {
  'Agadez':
    'M 28 230 L 18 195 L 15 150 L 20 105 L 95 85 L 140 78 L 175 90 ' +
    'L 215 55 L 270 40 L 320 28 L 395 18 L 470 12 L 550 8 L 630 5 L 700 3 L 760 8 ' +
    'L 770 55 L 758 110 L 762 160 L 755 215 L 748 280 L 740 340 L 735 370 ' +
    'L 640 378 L 560 365 L 470 348 L 390 332 L 320 315 L 260 298 ' +
    'L 200 280 L 145 262 L 90 248 L 50 240 Z',
  'Tahoua':
    'M 145 262 L 200 280 L 260 298 L 320 315 L 390 332 L 390 420 ' +
    'L 375 455 L 350 480 L 330 500 L 305 515 L 280 525 ' +
    'L 220 510 L 175 495 L 155 478 L 145 455 L 140 420 L 135 380 L 135 330 L 140 295 Z',
  'Tillabéri':
    'M 28 230 L 50 240 L 90 248 L 145 262 L 140 295 L 135 330 L 135 380 ' +
    'L 140 420 L 145 455 L 120 465 L 95 472 ' +
    'L 80 488 L 65 510 L 48 535 L 35 555 L 22 565 L 12 555 L 8 530 ' +
    'L 10 490 L 12 450 L 14 410 L 16 370 L 18 330 L 20 290 L 24 260 Z',
  'Niamey':
    'M 95 472 L 120 465 L 128 475 L 125 492 L 112 500 L 95 495 L 88 485 Z',
  'Dosso':
    'M 95 495 L 112 500 L 125 492 L 128 475 L 145 455 L 155 478 L 175 495 ' +
    'L 220 510 L 280 525 L 275 540 L 260 555 L 235 565 L 195 572 ' +
    'L 150 578 L 110 580 L 75 575 L 48 535 L 65 510 L 80 488 Z',
  'Maradi':
    'M 280 525 L 305 515 L 330 500 L 350 480 L 375 455 L 390 420 L 390 332 ' +
    'L 470 348 L 475 385 L 475 420 L 470 460 L 460 500 L 450 530 ' +
    'L 425 545 L 390 555 L 350 562 L 310 558 L 275 540 Z',
  'Zinder':
    'M 470 348 L 560 365 L 640 378 L 640 410 L 638 445 L 632 480 L 625 510 ' +
    'L 610 530 L 580 545 L 540 555 L 500 550 L 465 542 L 450 530 ' +
    'L 460 500 L 470 460 L 475 420 L 475 385 Z',
  'Diffa':
    'M 640 378 L 735 370 L 740 340 L 748 280 L 755 215 L 762 160 ' +
    'L 770 185 L 772 230 L 768 290 L 758 350 L 748 400 L 735 440 ' +
    'L 720 475 L 700 505 L 680 525 L 655 535 L 625 510 L 632 480 ' +
    'L 638 445 L 640 410 Z',
};

// Pre-computed label positions for better placement
const LABEL_POSITIONS: Record<string, { x: number; y: number; size: number }> = {
  'Agadez':    { x: 420, y: 165, size: 14 },
  'Tahoua':    { x: 260, y: 390, size: 12 },
  'Tillabéri': { x: 65,  y: 380, size: 10 },
  'Niamey':    { x: 108, y: 483, size: 7 },
  'Dosso':     { x: 170, y: 545, size: 11 },
  'Maradi':    { x: 400, y: 470, size: 12 },
  'Zinder':    { x: 555, y: 465, size: 12 },
  'Diffa':     { x: 705, y: 400, size: 11 },
};

function getRegionFill(region: Region, filter: string, isHovered: boolean): string {
  if (isHovered) return '#1f2937';

  switch (filter) {
    case 'securite':
      return SECURITY_COLORS[region.security_level]?.fill || '#d1d5db';
    case 'ressources':
      return region.natural_resources.length > 2 ? '#059669' : region.natural_resources.length > 0 ? '#34d399' : '#d1d5db';
    case 'demographie': {
      if (region.population > 4_000_000) return '#1e40af';
      if (region.population > 2_000_000) return '#3b82f6';
      if (region.population > 1_000_000) return '#93c5fd';
      return '#dbeafe';
    }
    case 'economie':
      return region.economic_activities.length > 3 ? '#7c3aed' : region.economic_activities.length > 2 ? '#a78bfa' : '#ddd6fe';
    default:
      return '#e5e7eb';
  }
}

export function NigerMap({ regions, filter }: NigerMapProps) {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);

  const handleRegionClick = useCallback((region: Region) => {
    setSelectedRegion(region);
  }, []);

  const regionMap = Object.fromEntries(regions.map((r) => [r.name, r]));

  return (
    <div className="relative">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Map */}
        <div className="flex-1 bg-white rounded-2xl border border-black/[0.06] p-4 sm:p-6">
          <svg
            viewBox="0 0 800 600"
            className="w-full h-auto max-h-[500px]"
            role="img"
            aria-label="Carte interactive du Niger"
          >
            {Object.entries(REGION_PATHS).map(([name, path]) => {
              const region = regionMap[name];
              if (!region) return null;
              const isHovered = hoveredRegion === name;
              const label = LABEL_POSITIONS[name] || { x: 400, y: 300, size: 11 };

              return (
                <g key={name}>
                  <path
                    d={path}
                    fill={getRegionFill(region, filter, isHovered)}
                    stroke="#fff"
                    strokeWidth={2}
                    className="cursor-pointer transition-all duration-200"
                    onMouseEnter={() => setHoveredRegion(name)}
                    onMouseLeave={() => setHoveredRegion(null)}
                    onClick={() => handleRegionClick(region)}
                  />
                  <text
                    x={label.x}
                    y={label.y}
                    textAnchor="middle"
                    className="pointer-events-none select-none"
                    fill={isHovered ? '#fff' : '#374151'}
                    fontSize={label.size}
                    fontWeight={600}
                  >
                    {name}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Legend */}
          {filter === 'securite' && (
            <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-black/[0.06]">
              {Object.entries(SECURITY_COLORS).map(([key, val]) => (
                <div key={key} className="flex items-center gap-1.5 text-[12px] text-gray-600">
                  <div className={`w-2.5 h-2.5 rounded-full ${val.dot}`} />
                  {val.label}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel */}
        {selectedRegion && (
          <div className="lg:w-[360px] bg-white rounded-2xl border border-black/[0.06] p-6 animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="text-xl font-bold">{selectedRegion.name}</h3>
                <p className="text-[13px] text-gray-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5" />
                  Capitale : {selectedRegion.capital}
                </p>
              </div>
              <button
                onClick={() => setSelectedRegion(null)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Population */}
              <div className="flex items-center gap-3 p-3 bg-[#fafaf9] rounded-xl">
                <Users className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-[12px] text-gray-400">Population</p>
                  <p className="font-semibold">{selectedRegion.population?.toLocaleString('fr-FR')} hab.</p>
                </div>
              </div>

              {/* Sécurité */}
              <div className="flex items-center gap-3 p-3 bg-[#fafaf9] rounded-xl">
                <Shield className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-[12px] text-gray-400">Sécurité</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${SECURITY_COLORS[selectedRegion.security_level]?.dot}`} />
                    <p className="font-semibold text-[14px]">{SECURITY_COLORS[selectedRegion.security_level]?.label}</p>
                  </div>
                  {selectedRegion.security_note && (
                    <p className="text-[12px] text-gray-500 mt-0.5">{selectedRegion.security_note}</p>
                  )}
                </div>
              </div>

              {/* Activités */}
              {selectedRegion.economic_activities?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Briefcase className="w-4 h-4 text-gray-500" />
                    <p className="text-[13px] font-medium text-gray-700">Activités économiques</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedRegion.economic_activities.map((a) => (
                      <span key={a} className="px-2.5 py-1 bg-gray-100 text-[12px] rounded-full text-gray-700">{a}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Ressources */}
              {selectedRegion.natural_resources?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Gem className="w-4 h-4 text-gray-500" />
                    <p className="text-[13px] font-medium text-gray-700">Ressources naturelles</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedRegion.natural_resources.map((r) => (
                      <span key={r} className="px-2.5 py-1 bg-emerald-50 text-[12px] rounded-full text-emerald-700">{r}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

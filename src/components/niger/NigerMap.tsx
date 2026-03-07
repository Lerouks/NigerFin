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

// Simplified SVG paths for Niger's 8 regions
const REGION_PATHS: Record<string, string> = {
  'Agadez':
    'M 140 10 L 280 10 L 310 30 L 320 80 L 310 140 L 280 180 L 240 200 L 200 210 L 160 200 L 130 180 L 110 140 L 100 100 L 110 50 Z',
  'Diffa':
    'M 310 140 L 320 80 L 360 90 L 390 120 L 400 160 L 390 200 L 360 220 L 320 210 L 310 180 L 280 180 Z',
  'Dosso':
    'M 80 280 L 120 260 L 160 270 L 180 290 L 170 320 L 140 340 L 100 330 L 70 310 Z',
  'Maradi':
    'M 200 250 L 240 240 L 280 250 L 300 270 L 290 300 L 260 320 L 220 310 L 190 290 Z',
  'Niamey':
    'M 90 260 L 110 250 L 120 260 L 115 275 L 100 280 L 85 275 Z',
  'Tahoua':
    'M 110 140 L 160 200 L 200 210 L 200 250 L 160 270 L 120 260 L 90 260 L 80 230 L 80 180 Z',
  'Tillabéri':
    'M 40 160 L 80 180 L 80 230 L 90 260 L 80 280 L 50 300 L 20 280 L 10 240 L 20 200 Z',
  'Zinder':
    'M 240 200 L 280 180 L 310 180 L 320 210 L 310 240 L 280 250 L 240 240 L 220 220 Z',
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
            viewBox="0 0 420 360"
            className="w-full h-auto max-h-[500px]"
            role="img"
            aria-label="Carte interactive du Niger"
          >
            {Object.entries(REGION_PATHS).map(([name, path]) => {
              const region = regionMap[name];
              if (!region) return null;
              const isHovered = hoveredRegion === name;

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
                    x={getPathCenter(path).x}
                    y={getPathCenter(path).y}
                    textAnchor="middle"
                    className="pointer-events-none select-none"
                    fill={isHovered ? '#fff' : '#374151'}
                    fontSize={name === 'Niamey' ? 8 : 11}
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

// Helper to calculate center of SVG path for labels
function getPathCenter(path: string): { x: number; y: number } {
  const coords = path.match(/(\d+)\s+(\d+)/g);
  if (!coords) return { x: 0, y: 0 };
  let sumX = 0, sumY = 0;
  coords.forEach((c) => {
    const [x, y] = c.split(/\s+/).map(Number);
    sumX += x;
    sumY += y;
  });
  return { x: sumX / coords.length, y: sumY / coords.length };
}

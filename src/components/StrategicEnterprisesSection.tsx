'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Building2,
  Pickaxe,
  Zap,
  Phone,
  Landmark,
  Wheat,
  Truck,
  HardHat,
  Fuel,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';

interface Enterprise {
  id: string;
  name: string;
  slug: string | null;
  sector: string;
  description: string;
  logo_url: string | null;
  image_url: string | null;
  brand_color: string | null;
}

/* ── Sector icons ────────────────────────────────────────────── */

const SECTOR_ICONS: Record<string, LucideIcon> = {
  'Mines & Uranium': Pickaxe,
  'Mines & Ressources': Pickaxe,
  'Pétrole & Énergie': Fuel,
  'Électricité & Énergie': Zap,
  'Télécommunications': Phone,
  'Banque & Finance': Landmark,
  'Agriculture & Agroalimentaire': Wheat,
  'Transport & Logistique': Truck,
  'BTP & Infrastructures': HardHat,
};

function getSectorIcon(sector: string): LucideIcon {
  return SECTOR_ICONS[sector] || Building2;
}

/* ── Component ────────────────────────────────────────────────── */

export function StrategicEnterprisesSection() {
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSector, setActiveSector] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetch('/api/strategic-enterprises')
      .then((r) => (r.ok ? r.json() : []))
      .then(setEnterprises)
      .catch(() => setEnterprises([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading && enterprises.length > 0) {
      const t = setTimeout(() => setVisible(true), 100);
      return () => clearTimeout(t);
    }
  }, [loading, enterprises.length]);

  const sectors = Array.from(new Set(enterprises.map((e) => e.sector)));

  const filtered = activeSector
    ? enterprises.filter((e) => e.sector === activeSector)
    : enterprises;

  const handleSectorClick = useCallback((sector: string) => {
    setActiveSector((prev) => (prev === sector ? null : sector));
  }, []);

  if (loading) {
    return (
      <section>
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 bg-black/[0.04] rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-56 bg-black/[0.03] rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (enterprises.length === 0) return null;

  return (
    <section>
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#d4a843]/10 border border-[#d4a843]/20 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-[#d4a843]" />
          </div>
          <span className="text-[11px] font-semibold tracking-[0.15em] uppercase text-[#d4a843]">
            Acteurs clés
          </span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-[#1a1a1a] leading-tight">
          Entreprises stratégiques du Niger
        </h2>
        <p className="text-[15px] text-gray-500 mt-2 max-w-xl leading-relaxed">
          Les piliers de l&apos;économie nigérienne : mines, énergie, finance, télécoms et agriculture.
        </p>
      </div>

      {/* Sector filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setActiveSector(null)}
          className={`px-4 py-2 rounded-full text-[12px] font-medium transition-all duration-200 ${
            activeSector === null
              ? 'bg-[#111] text-white'
              : 'bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 border border-black/[0.08]'
          }`}
        >
          Tous les secteurs
        </button>
        {sectors.map((sector) => {
          const Icon = getSectorIcon(sector);
          const isActive = activeSector === sector;
          return (
            <button
              key={sector}
              onClick={() => handleSectorClick(sector)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-[#111] text-white'
                  : 'bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 border border-black/[0.08]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {sector}
            </button>
          );
        })}
      </div>

      {/* Count */}
      <p className="text-[13px] text-gray-400 mb-6">
        {filtered.length} entreprise{filtered.length !== 1 ? 's' : ''}
        {activeSector ? ` dans ${activeSector}` : ''}
      </p>

      {/* Enterprise grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((enterprise, index) => {
          const Icon = getSectorIcon(enterprise.sector);
          const color = enterprise.brand_color || '#111';

          const cardContent = (
            <article
              className={`group relative bg-white rounded-2xl overflow-hidden border border-black/[0.06] transition-all duration-400 hover:shadow-xl hover:-translate-y-1 ${
                visible
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-4'
              }`}
              style={{
                transitionDelay: visible ? `${index * 60}ms` : '0ms',
              }}
            >
              {/* Top accent bar - brand color */}
              <div className="h-1 w-full" style={{ backgroundColor: color }} />

              {/* Brand color subtle gradient behind card */}
              <div
                className="absolute top-0 left-0 right-0 h-40 pointer-events-none opacity-[0.06]"
                style={{ background: `linear-gradient(to bottom, ${color}, transparent)` }}
              />

              <div className="relative p-6">
                {/* Logo + Name */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 bg-white border border-black/[0.06] p-1.5 shadow-sm group-hover:shadow-md transition-shadow duration-300">
                    {enterprise.logo_url ? (
                      <img
                        src={enterprise.logo_url}
                        alt={`Logo ${enterprise.name}`}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-[20px] font-bold" style={{ color }}>
                        {enterprise.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[16px] font-semibold text-[#1a1a1a] leading-tight">
                      {enterprise.name}
                    </h3>
                    <span
                      className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 text-[10px] font-medium rounded-full"
                      style={{
                        color,
                        backgroundColor: `${color}10`,
                        boxShadow: `inset 0 0 0 1px ${color}20`,
                      }}
                    >
                      <Icon className="w-3 h-3" />
                      {enterprise.sector}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-[13px] leading-relaxed text-gray-500 group-hover:text-gray-600 transition-colors duration-300">
                  {enterprise.description}
                </p>

                {/* Bottom action */}
                <div className="mt-5 pt-4 border-t border-black/[0.04] flex items-center justify-between">
                  <span className="text-[12px] font-medium" style={{ color }}>
                    En savoir plus
                  </span>
                  <ChevronRight
                    className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-300"
                    style={{ color }}
                  />
                </div>
              </div>

              {/* Hover glow - brand color */}
              <div
                className="absolute -bottom-16 -right-16 w-32 h-32 rounded-full opacity-0 group-hover:opacity-20 blur-[50px] transition-opacity duration-700 pointer-events-none"
                style={{ backgroundColor: color }}
              />
            </article>
          );

          return enterprise.slug ? (
            <Link key={enterprise.id} href={`/entreprises/${enterprise.slug}`} className="block">
              {cardContent}
            </Link>
          ) : (
            <div key={enterprise.id}>{cardContent}</div>
          );
        })}
      </div>

      {/* Bottom stats */}
      <div className="mt-10 pt-8 border-t border-black/[0.06]">
        <div className="flex flex-wrap gap-6 md:gap-10">
          {sectors.map((sector) => {
            const Icon = getSectorIcon(sector);
            const count = enterprises.filter((e) => e.sector === sector).length;
            return (
              <button
                key={sector}
                onClick={() => handleSectorClick(sector)}
                className="flex items-center gap-3 group/stat cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#f5f5f0] border border-black/[0.06] group-hover/stat:bg-[#111] group-hover/stat:border-[#111] transition-colors duration-200">
                  <Icon className="w-4 h-4 text-gray-400 group-hover/stat:text-white transition-colors duration-200" />
                </div>
                <div className="text-left">
                  <p className="text-[18px] font-bold text-[#1a1a1a]">{count}</p>
                  <p className="text-[10px] text-gray-400 leading-tight">
                    {sector.split(' & ')[0]}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

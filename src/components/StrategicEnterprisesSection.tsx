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

/* ── Sector configuration ─────────────────────────────────────── */

interface SectorConfig {
  icon: LucideIcon;
  gradient: string;
  glow: string;
  badge: string;
  accent: string;
}

const SECTOR_MAP: Record<string, SectorConfig> = {
  'Mines & Uranium': {
    icon: Pickaxe,
    gradient: 'from-amber-500/20 via-amber-400/5 to-transparent',
    glow: 'group-hover:shadow-amber-500/10',
    badge: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
    accent: '#f59e0b',
  },
  'Mines & Ressources': {
    icon: Pickaxe,
    gradient: 'from-orange-500/20 via-orange-400/5 to-transparent',
    glow: 'group-hover:shadow-orange-500/10',
    badge: 'bg-orange-500/10 text-orange-400 ring-orange-500/20',
    accent: '#f97316',
  },
  'Pétrole & Énergie': {
    icon: Fuel,
    gradient: 'from-red-500/20 via-red-400/5 to-transparent',
    glow: 'group-hover:shadow-red-500/10',
    badge: 'bg-red-500/10 text-red-400 ring-red-500/20',
    accent: '#ef4444',
  },
  'Électricité & Énergie': {
    icon: Zap,
    gradient: 'from-yellow-500/20 via-yellow-400/5 to-transparent',
    glow: 'group-hover:shadow-yellow-500/10',
    badge: 'bg-yellow-500/10 text-yellow-400 ring-yellow-500/20',
    accent: '#eab308',
  },
  'Télécommunications': {
    icon: Phone,
    gradient: 'from-blue-500/20 via-blue-400/5 to-transparent',
    glow: 'group-hover:shadow-blue-500/10',
    badge: 'bg-blue-500/10 text-blue-400 ring-blue-500/20',
    accent: '#3b82f6',
  },
  'Banque & Finance': {
    icon: Landmark,
    gradient: 'from-emerald-500/20 via-emerald-400/5 to-transparent',
    glow: 'group-hover:shadow-emerald-500/10',
    badge: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
    accent: '#10b981',
  },
  'Agriculture & Agroalimentaire': {
    icon: Wheat,
    gradient: 'from-green-500/20 via-green-400/5 to-transparent',
    glow: 'group-hover:shadow-green-500/10',
    badge: 'bg-green-500/10 text-green-400 ring-green-500/20',
    accent: '#22c55e',
  },
  'Transport & Logistique': {
    icon: Truck,
    gradient: 'from-indigo-500/20 via-indigo-400/5 to-transparent',
    glow: 'group-hover:shadow-indigo-500/10',
    badge: 'bg-indigo-500/10 text-indigo-400 ring-indigo-500/20',
    accent: '#6366f1',
  },
  'BTP & Infrastructures': {
    icon: HardHat,
    gradient: 'from-slate-400/20 via-slate-400/5 to-transparent',
    glow: 'group-hover:shadow-slate-400/10',
    badge: 'bg-slate-500/10 text-slate-400 ring-slate-500/20',
    accent: '#94a3b8',
  },
};

const DEFAULT_CONFIG: SectorConfig = {
  icon: Building2,
  gradient: 'from-gray-500/20 via-gray-400/5 to-transparent',
  glow: 'group-hover:shadow-gray-500/10',
  badge: 'bg-gray-500/10 text-gray-400 ring-gray-500/20',
  accent: '#9ca3af',
};

function getSectorConfig(sector: string): SectorConfig {
  return SECTOR_MAP[sector] || DEFAULT_CONFIG;
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

  // Trigger staggered entrance once loaded
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
      <section className="mt-16 md:mt-24 rounded-3xl bg-[#0d0d0d] p-8 md:p-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 bg-white/5 rounded-lg" />
          <div className="flex gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-9 w-28 bg-white/5 rounded-full" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-white/[0.03] rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (enterprises.length === 0) return null;

  return (
    <section className="mt-16 md:mt-24 relative overflow-hidden rounded-3xl bg-[#0d0d0d]">
      {/* Background grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Gradient glow top-right */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#d4a843]/8 rounded-full blur-[120px] pointer-events-none" />
      {/* Gradient glow bottom-left */}
      <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-[#d4a843]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 p-6 sm:p-8 md:p-12 lg:p-16">
        {/* ── Header ──────────────────────────────────────────── */}
        <div className="mb-10 md:mb-14">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#d4a843]/10 border border-[#d4a843]/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-[#d4a843]" />
            </div>
            <span className="text-[11px] font-semibold tracking-[0.15em] uppercase text-[#d4a843]/70">
              Acteurs clés
            </span>
          </div>
          <h2 className="text-[28px] sm:text-[36px] lg:text-[42px] font-bold text-white leading-[1.1] tracking-tight">
            Entreprises indispensables
            <br />
            <span className="text-white/40">du Niger</span>
          </h2>
          <p className="text-[15px] text-white/40 mt-3 max-w-xl leading-relaxed">
            Les piliers de l&apos;économie nigérienne : mines, énergie, finance,
            télécoms et agriculture. Explorez par secteur.
          </p>
        </div>

        {/* ── Sector filters ─────────────────────────────────── */}
        <div className="flex flex-wrap gap-2 mb-10">
          <button
            onClick={() => setActiveSector(null)}
            className={`px-4 py-2 rounded-full text-[12px] font-medium transition-all duration-200 ${
              activeSector === null
                ? 'bg-white text-[#0d0d0d]'
                : 'bg-white/[0.05] text-white/50 hover:bg-white/[0.08] hover:text-white/70 border border-white/[0.06]'
            }`}
          >
            Tous les secteurs
          </button>
          {sectors.map((sector) => {
            const config = getSectorConfig(sector);
            const Icon = config.icon;
            const isActive = activeSector === sector;
            return (
              <button
                key={sector}
                onClick={() => handleSectorClick(sector)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-white text-[#0d0d0d]'
                    : 'bg-white/[0.05] text-white/50 hover:bg-white/[0.08] hover:text-white/70 border border-white/[0.06]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {sector}
              </button>
            );
          })}
        </div>

        {/* ── Count ───────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-[13px] text-white/30">
            {filtered.length} entreprise{filtered.length !== 1 ? 's' : ''}
            {activeSector ? ` dans ${activeSector}` : ''}
          </p>
        </div>

        {/* ── Enterprise grid ─────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((enterprise, index) => {
            const config = getSectorConfig(enterprise.sector);
            const Icon = config.icon;
            const color = enterprise.brand_color || config.accent;

            const cardContent = (
              <article
                className={`group relative rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm transition-all duration-500 hover:border-white/[0.15] hover:bg-white/[0.04] hover:shadow-2xl hover:-translate-y-1 ${
                  visible
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-4'
                }`}
                style={{
                  transitionDelay: visible ? `${index * 60}ms` : '0ms',
                }}
              >
                {/* Top gradient accent - uses brand color */}
                <div
                  className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b to-transparent pointer-events-none opacity-15"
                  style={{ background: `linear-gradient(to bottom, ${color}30, transparent)` }}
                />

                {/* Image banner */}
                {enterprise.image_url && (
                  <div className="relative h-36 overflow-hidden">
                    <img
                      src={enterprise.image_url}
                      alt={enterprise.name}
                      className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d]/60 to-transparent" />
                  </div>
                )}

                <div className={`relative p-6 ${enterprise.image_url ? 'pt-4' : 'pt-8'}`}>
                  {/* Logo + Name row */}
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 border border-white/[0.1] bg-white p-1.5 shadow-lg"
                    >
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
                      <h3 className="text-[16px] font-semibold text-white leading-tight group-hover:text-white transition-colors">
                        {enterprise.name}
                      </h3>
                      <span
                        className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 text-[10px] font-medium rounded-full"
                        style={{
                          color,
                          boxShadow: `inset 0 0 0 1px ${color}40`,
                        }}
                      >
                        <Icon className="w-3 h-3" />
                        {enterprise.sector}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-[13px] leading-relaxed text-white/35 group-hover:text-white/50 transition-colors duration-300">
                    {enterprise.description}
                  </p>

                  {/* Bottom action hint - uses brand color on hover */}
                  <div className="mt-5 pt-4 border-t border-white/[0.04] flex items-center justify-between">
                    <span
                      className="text-[11px] text-white/20 group-hover:transition-colors duration-300"
                      style={{ ['--tw-group-hover-color' as string]: color }}
                    >
                      <span className="group-hover:hidden">En savoir plus</span>
                      <span className="hidden group-hover:inline" style={{ color }}>En savoir plus</span>
                    </span>
                    <ChevronRight
                      className="w-4 h-4 text-white/10 group-hover:translate-x-0.5 transition-all duration-300"
                      style={{ color: 'inherit' }}
                    />
                  </div>
                </div>

                {/* Hover glow effect - uses brand color */}
                <div
                  className="absolute -bottom-20 -right-20 w-40 h-40 rounded-full opacity-0 group-hover:opacity-100 blur-[60px] transition-opacity duration-700 pointer-events-none"
                  style={{ backgroundColor: color }}
                />

                {/* Top border glow on hover */}
                <div
                  className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
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

        {/* ── Bottom stats bar ─────────────────────────────────── */}
        <div className="mt-12 pt-8 border-t border-white/[0.04]">
          <div className="flex flex-wrap gap-6 md:gap-10">
            {sectors.slice(0, 5).map((sector) => {
              const config = getSectorConfig(sector);
              const Icon = config.icon;
              const count = enterprises.filter((e) => e.sector === sector).length;
              return (
                <button
                  key={sector}
                  onClick={() => handleSectorClick(sector)}
                  className="flex items-center gap-3 group/stat cursor-pointer"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/[0.06] bg-white/[0.03] group-hover/stat:bg-white/[0.06] transition-colors"
                  >
                    <Icon className="w-4 h-4 text-white/30 group-hover/stat:text-white/60 transition-colors" />
                  </div>
                  <div className="text-left">
                    <p className="text-[18px] font-bold text-white/80">{count}</p>
                    <p className="text-[10px] text-white/25 leading-tight">
                      {sector.split(' & ')[0]}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

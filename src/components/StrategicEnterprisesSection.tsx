'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
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
      <section className="rounded-3xl bg-[#0d0d0d] p-8 md:p-12">
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
    <section className="relative overflow-hidden rounded-3xl bg-[#0d0d0d]">
      {/* Background grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Ambient glows */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#d4a843]/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-[#d4a843]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 p-6 sm:p-8 md:p-12 lg:p-16">
        {/* Header */}
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

        {/* Sector filters */}
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
            const Icon = getSectorIcon(sector);
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

        {/* Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-[13px] text-white/30">
            {filtered.length} entreprise{filtered.length !== 1 ? 's' : ''}
            {activeSector ? ` dans ${activeSector}` : ''}
          </p>
        </div>

        {/* Enterprise grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((enterprise, index) => {
            const Icon = getSectorIcon(enterprise.sector);
            const color = enterprise.brand_color || '#d4a843';

            const cardContent = (
              <article
                className={`group relative rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm transition-all duration-500 hover:bg-white/[0.05] hover:shadow-2xl hover:-translate-y-1 ${
                  visible
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-4'
                }`}
                style={{
                  transitionDelay: visible ? `${index * 60}ms` : '0ms',
                }}
              >
                {/* Top accent bar - brand color */}
                <div
                  className="h-[2px] w-full opacity-60 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ backgroundColor: color }}
                />

                {/* Brand color gradient */}
                <div
                  className="absolute top-0 left-0 right-0 h-32 pointer-events-none opacity-[0.08] group-hover:opacity-[0.15] transition-opacity duration-500"
                  style={{ background: `linear-gradient(to bottom, ${color}, transparent)` }}
                />

                <div className="relative p-6 pt-7">
                  {/* Logo + Name */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 border border-white/[0.1] bg-white p-1.5 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                      {enterprise.logo_url ? (
                        <Image
                          src={enterprise.logo_url}
                          alt={`Logo ${enterprise.name}`}
                          width={48}
                          height={48}
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
                  <p className="text-[13px] leading-relaxed text-white/35 group-hover:text-white/55 transition-colors duration-300">
                    {enterprise.description}
                  </p>

                  {/* Bottom action */}
                  <div className="mt-5 pt-4 border-t border-white/[0.04] flex items-center justify-between">
                    <span className="text-[11px] text-white/20 group-hover:text-white/0 transition-colors duration-300">
                      En savoir plus
                    </span>
                    <span
                      className="text-[11px] font-medium absolute left-6 bottom-[25px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ color }}
                    >
                      En savoir plus
                    </span>
                    <ChevronRight
                      className="w-4 h-4 text-white/10 group-hover:translate-x-0.5 transition-all duration-300"
                      style={{ ['--tw-group-hover-color' as string]: color }}
                    />
                  </div>
                </div>

                {/* Hover glow - brand color */}
                <div
                  className="absolute -bottom-20 -right-20 w-40 h-40 rounded-full opacity-0 group-hover:opacity-100 blur-[60px] transition-opacity duration-700 pointer-events-none"
                  style={{ backgroundColor: color }}
                />

                {/* Hover border glow */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ boxShadow: `inset 0 0 0 1px ${color}30` }}
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

      </div>
    </section>
  );
}

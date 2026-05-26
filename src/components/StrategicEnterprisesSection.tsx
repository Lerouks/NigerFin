'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getSector } from '@/lib/sectors';

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
          <div className="h-8 w-64 bg-black/4 rounded-lg" />
          <div className="flex gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-9 w-28 bg-black/4 rounded-full" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-44 bg-black/4 rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (enterprises.length === 0) return null;

  return (
    <section>
      {/* Header, eyebrow + heading sobre */}
      <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-3">
            <div className="h-px w-6 bg-gold/60" />
            <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-gold">
              Acteurs stratégiques
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-[#111]">
            Les piliers de l&apos;économie nigérienne
          </h2>
        </div>
        <span className="text-[13px] text-gray-500">
          {enterprises.length} entreprise{enterprises.length !== 1 ? 's' : ''}
          {' '}&middot;{' '}
          {sectors.length} secteur{sectors.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Filtres pilules avec icône colorée par secteur */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setActiveSector(null)}
          className={`px-4 py-2 rounded-full text-[12px] font-medium transition-colors duration-200 ${
            activeSector === null
              ? 'bg-[#111] text-white'
              : 'bg-white text-gray-700 border border-black/8 hover:border-black/20 hover:bg-gray-50'
          }`}
        >
          Tous les secteurs
        </button>
        {sectors.map((sectorLabel) => {
          const sector = getSector(sectorLabel);
          const Icon = sector.icon;
          const isActive = activeSector === sectorLabel;
          return (
            <button
              key={sectorLabel}
              onClick={() => handleSectorClick(sectorLabel)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-medium transition-colors duration-200 ${
                isActive
                  ? 'bg-[#111] text-white'
                  : 'bg-white text-gray-700 border border-black/8 hover:border-black/20 hover:bg-gray-50'
              }`}
            >
              <Icon
                className="w-3.5 h-3.5"
                style={{ color: isActive ? sector.hexLight : sector.hex }}
              />
              {sectorLabel}
            </button>
          );
        })}
      </div>

      {/* Grid cards blanches */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((enterprise, index) => {
          const sector = getSector(enterprise.sector);
          const Icon = sector.icon;
          const accent = sector.hex;

          const cardContent = (
            <article
              className={`group relative h-full bg-white rounded-xl border border-black/6 p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-black/12 ${
                visible
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-2'
              }`}
              style={{
                transitionDelay: visible ? `${index * 40}ms` : '0ms',
              }}
            >
              {/* Bande verticale couleur secteur, accent gauche */}
              <div
                className="absolute left-0 top-6 bottom-6 w-[3px] rounded-r"
                style={{ backgroundColor: accent }}
              />
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-lg bg-gray-50 border border-black/6 flex items-center justify-center shrink-0 overflow-hidden">
                  {enterprise.logo_url ? (
                    <Image
                      src={enterprise.logo_url}
                      alt={`Logo ${enterprise.name}`}
                      width={48}
                      height={48}
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <span className="text-[18px] font-bold text-gray-500">
                      {enterprise.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[16px] font-semibold text-[#111] leading-tight">
                    {enterprise.name}
                  </h3>
                  <span
                    className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-sm"
                    style={{
                      color: accent,
                      backgroundColor: `${accent}14`,
                    }}
                  >
                    <Icon className="w-3 h-3" />
                    {enterprise.sector}
                  </span>
                </div>
              </div>

              <p className="text-[13px] leading-relaxed text-gray-600 line-clamp-3">
                {enterprise.description}
              </p>
            </article>
          );

          return enterprise.slug ? (
            <Link
              key={enterprise.id}
              href={`/entreprises/${enterprise.slug}`}
              className="block focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 rounded-xl"
              style={{ ['--tw-ring-color' as string]: accent }}
            >
              {cardContent}
            </Link>
          ) : (
            <div key={enterprise.id}>{cardContent}</div>
          );
        })}
      </div>
    </section>
  );
}

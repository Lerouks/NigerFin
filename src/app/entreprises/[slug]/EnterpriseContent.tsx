'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft, MapPin, Calendar, Users, Globe, DollarSign,
  Landmark, ExternalLink, ChevronRight,
} from 'lucide-react';
import { ArticleCard } from '@/components/ArticleCard';
import { getSector } from '@/lib/sectors';
import type { Article } from '@/types';

/**
 * Eclaircit un hex en le melangeant avec du blanc.
 * amount entre 0 (couleur originale) et 1 (blanc pur).
 * Garantit que la couleur reste lisible sur fond noir meme pour des
 * brand colors tres sombres (ex: #8B1A2B bordeaux COMINAK -> rose-saumon).
 */
function lightenHex(hex: string, amount: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const mix = (channel: number) => Math.round(channel + (255 - channel) * amount);
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
}

interface Enterprise {
  id: string;
  name: string;
  slug: string;
  sector: string;
  description: string;
  full_name: string | null;
  founded_year: number | null;
  headquarters: string | null;
  employees: string | null;
  revenue: string | null;
  ownership: string | null;
  website: string | null;
  detailed_description: string | null;
  logo_url: string | null;
  image_url: string | null;
  key_facts: { label: string; value: string }[] | null;
  brand_color: string | null;
}

interface EnterpriseContentProps {
  enterprise: Enterprise;
  relatedArticles: Article[];
}

function InfoRow({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ backgroundColor: `${color}14` }}
      >
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-[0.12em] text-gray-500">{label}</p>
        <p className="text-[14px] text-gray-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export function EnterpriseContent({ enterprise, relatedArticles }: EnterpriseContentProps) {
  const hasInfo = enterprise.full_name || enterprise.founded_year || enterprise.headquarters
    || enterprise.ownership || enterprise.employees || enterprise.revenue || enterprise.website;
  const sector = getSector(enterprise.sector);
  const SectorIcon = sector.icon;
  // Couleur de la SOCIETE (brand_color DB), fallback sur couleur secteur si null.
  // accentLight = version eclaircie programmatique pour rester lisible sur fond noir
  // meme quand brand_color est tres sombre (ex bordeaux COMINAK).
  const accent = enterprise.brand_color || sector.hex;
  const accentLight = lightenHex(accent, 0.45);
  const logoFallbackColor = accent;

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Header noir sobre, sans halos colores derriere le logo */}
      <div className="relative bg-[#111] text-white overflow-hidden">
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
          <Link
            href="/entreprises"
            className="inline-flex items-center gap-1.5 text-[13px] text-white/60 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Entreprises
          </Link>

          <div className="flex items-start gap-5">
            {/* Logo - white background for clarity */}
            <div className="w-[4.5rem] h-[4.5rem] sm:w-24 sm:h-24 rounded-2xl bg-white flex items-center justify-center flex-shrink-0 shadow-xl p-2.5 sm:p-3">
              {enterprise.logo_url ? (
                <Image
                  src={enterprise.logo_url}
                  alt={`Logo ${enterprise.name}`}
                  width={96}
                  height={96}
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-2xl sm:text-3xl font-bold" style={{ color: logoFallbackColor }}>
                  {enterprise.name.charAt(0)}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-3xl sm:text-5xl font-bold leading-[1.05] tracking-tight">{enterprise.name}</h1>
              {enterprise.full_name && enterprise.full_name !== enterprise.name && (
                <p className="text-[14px] sm:text-[16px] text-white/65 mt-2">{enterprise.full_name}</p>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-4">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold tracking-wide rounded-full"
                  style={{
                    backgroundColor: `${accentLight}22`,
                    color: accentLight,
                    boxShadow: `inset 0 0 0 1px ${accentLight}40`,
                  }}
                >
                  <SectorIcon className="w-3.5 h-3.5" />
                  {sector.label}
                </span>
                {enterprise.founded_year && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] text-white/60 rounded-full ring-1 ring-inset ring-white/15">
                    <Calendar className="w-3 h-3" />
                    Depuis {enterprise.founded_year}
                  </span>
                )}
                {enterprise.headquarters && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] text-white/60 rounded-full ring-1 ring-inset ring-white/15">
                    <MapPin className="w-3 h-3" />
                    {enterprise.headquarters}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sector accent bottom bar */}
        <div className="h-1.5" style={{ backgroundColor: accent }} />
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div className="bg-white rounded-xl shadow-[0_4px_40px_-12px_rgba(0,0,0,0.08)] p-6 sm:p-8">
              <h2 className="text-[12px] uppercase tracking-[0.15em] text-gray-500 mb-4">Présentation</h2>
              <p className="text-[15px] leading-relaxed text-gray-800">
                {enterprise.detailed_description || enterprise.description}
              </p>
            </div>

            {/* Key facts */}
            {enterprise.key_facts && enterprise.key_facts.length > 0 && (
              <div className="bg-white rounded-xl shadow-[0_4px_40px_-12px_rgba(0,0,0,0.08)] p-6 sm:p-8">
                <h2 className="text-[12px] uppercase tracking-[0.15em] text-gray-500 mb-4">Points clés</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {enterprise.key_facts.map((fact, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-lg border border-black/[0.05]"
                      style={{ backgroundColor: `${accent}0D`, borderLeftColor: accent, borderLeftWidth: '2px' }}
                    >
                      <p className="text-[11px] uppercase tracking-[0.1em] mb-1 font-semibold" style={{ color: accent }}>{fact.label}</p>
                      <p className="text-[14px] font-medium text-gray-900">{fact.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Related articles */}
            {relatedArticles.length > 0 && (
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <h2 className="text-lg font-semibold">Articles liés</h2>
                  <div className="flex-1 h-px bg-black/[0.06]" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {relatedArticles.map((article) => (
                    <ArticleCard key={article._id} article={article} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Fiche d'identite */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 space-y-6">
              {hasInfo && (
                <div className="bg-white rounded-xl shadow-[0_4px_40px_-12px_rgba(0,0,0,0.08)] p-6">
                  <h2 className="text-[12px] uppercase tracking-[0.15em] text-gray-500 mb-3">Fiche d&apos;identité</h2>
                  <div className="divide-y divide-black/[0.05]">
                    {enterprise.headquarters && (
                      <InfoRow icon={MapPin} label="Siège" value={enterprise.headquarters} color={accent} />
                    )}
                    {enterprise.founded_year && (
                      <InfoRow icon={Calendar} label="Fondation" value={String(enterprise.founded_year)} color={accent} />
                    )}
                    {enterprise.ownership && (
                      <InfoRow icon={Landmark} label="Actionnariat" value={enterprise.ownership} color={accent} />
                    )}
                    {enterprise.employees && (
                      <InfoRow icon={Users} label="Employés" value={enterprise.employees} color={accent} />
                    )}
                    {enterprise.revenue && (
                      <InfoRow icon={DollarSign} label="Chiffre d'affaires" value={enterprise.revenue} color={accent} />
                    )}
                    {enterprise.website && (
                      <div className="py-3">
                        <a
                          href={enterprise.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-[13px] font-semibold transition-opacity hover:opacity-75"
                          style={{ color: accent }}
                        >
                          <Globe className="w-4 h-4" />
                          Site officiel
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* CTA sobre, sans halo */}
              <div className="bg-[#111] text-white rounded-xl p-6">
                <p className="text-[13px] text-white/70 mb-3">
                  Vous souhaitez suivre l&apos;actualité de cette entreprise ?
                </p>
                <Link
                  href="/entreprises"
                  className="inline-flex items-center gap-2 text-[13px] font-semibold transition-opacity hover:opacity-80"
                  style={{ color: accentLight }}
                >
                  Voir toutes les entreprises
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

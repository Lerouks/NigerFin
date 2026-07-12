'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  Globe,
  DollarSign,
  Landmark,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { ArticleCard } from '@/components/ArticleCard';
import { CountryFlag } from '@/components/entreprises/CountryFlag';
import { parseOwnership } from '@/lib/ownership';
import type { Article } from '@/types';

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

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-secondary border border-black/6">
        <Icon className="w-4 h-4 text-foreground/70" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-[0.14em] text-gray-500 font-semibold">
          {label}
        </p>
        <div className="text-[14px] text-foreground mt-0.5">{value}</div>
      </div>
    </div>
  );
}

export function EnterpriseContent({
  enterprise,
  relatedArticles,
}: EnterpriseContentProps) {
  const hasInfo =
    enterprise.full_name ||
    enterprise.founded_year ||
    enterprise.headquarters ||
    enterprise.ownership ||
    enterprise.employees ||
    enterprise.revenue ||
    enterprise.website;
  const ownership = parseOwnership(enterprise.ownership);
  const takeaways = (enterprise.key_facts ?? []).slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      {/* Header noir, charte unique (gold accent uniquement) */}
      <div className="relative bg-[#0a0a0a] text-white overflow-hidden">
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
          <Link
            href="/entreprises"
            className="inline-flex items-center gap-1.5 text-[13px] text-white/60 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour a l&apos;atlas
          </Link>

          <div className="flex items-start gap-5">
            {/* Logo - fond blanc, couleur marque preservee (D3=A) */}
            <div className="w-18 h-18 sm:w-24 sm:h-24 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-xl p-2.5 sm:p-3">
              {enterprise.logo_url ? (
                <Image
                  src={enterprise.logo_url}
                  alt={`Logo ${enterprise.name}`}
                  width={96}
                  height={96}
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-2xl sm:text-3xl font-bold text-foreground">
                  {enterprise.name.charAt(0)}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-[0.22em] text-gold font-semibold mb-2">
                Dossier entreprise
              </p>
              <h1 className="text-3xl sm:text-5xl font-black leading-[1.05] tracking-tight">
                {enterprise.name}
              </h1>
              {enterprise.full_name &&
                enterprise.full_name !== enterprise.name && (
                  <p className="text-[14px] sm:text-[16px] text-white/65 mt-2 italic">
                    {enterprise.full_name}
                  </p>
                )}
              <div className="flex flex-wrap items-center gap-2 mt-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold tracking-wide rounded-full bg-white/10 text-white ring-1 ring-inset ring-white/20">
                  {enterprise.sector}
                </span>
                {enterprise.founded_year && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] text-white/65 rounded-full ring-1 ring-inset ring-white/15">
                    <Calendar className="w-3 h-3" />
                    Depuis {enterprise.founded_year}
                  </span>
                )}
                {enterprise.headquarters && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] text-white/65 rounded-full ring-1 ring-inset ring-white/15">
                    <MapPin className="w-3 h-3" />
                    {enterprise.headquarters}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Filet or signature */}
        <div className="h-[3px] bg-gold" />
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Section "A retenir" - bullets copy-paste friendly */}
            {takeaways.length > 0 && (
              <section
                aria-labelledby="takeaways-title"
                className="border-l-4 border-gold bg-gradient-to-br from-secondary to-background p-6 sm:p-8 rounded-r-xl"
              >
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="text-[11px] uppercase tracking-[0.22em] text-foreground font-extrabold">
                    A retenir
                  </span>
                </div>
                <ul
                  id="takeaways-title"
                  className="space-y-3 text-[15px] leading-relaxed text-foreground"
                >
                  {takeaways.map((fact, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span
                        aria-hidden
                        className="mt-2 shrink-0 w-1.5 h-1.5 rounded-full bg-gold"
                      />
                      <span>
                        <strong className="font-semibold">{fact.label} :</strong>{' '}
                        {fact.value}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Description */}
            <div className="bg-white rounded-xl shadow-[0_4px_40px_-12px_rgba(0,0,0,0.06)] border border-black/4 p-6 sm:p-8">
              <h2 className="text-[11px] uppercase tracking-[0.18em] text-gray-500 font-bold mb-4">
                Presentation
              </h2>
              <p className="text-[16px] leading-relaxed text-foreground/90 text-justify hyphens-auto">
                {enterprise.detailed_description || enterprise.description}
              </p>
            </div>

            {/* Key facts (complementaires si plus de 3) */}
            {enterprise.key_facts && enterprise.key_facts.length > 3 && (
              <div className="bg-white rounded-xl shadow-[0_4px_40px_-12px_rgba(0,0,0,0.06)] border border-black/4 p-6 sm:p-8">
                <h2 className="text-[11px] uppercase tracking-[0.18em] text-gray-500 font-bold mb-4">
                  Points cles
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {enterprise.key_facts.slice(3).map((fact, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-lg bg-secondary border border-black/5 border-l-2 border-l-gold"
                    >
                      <p className="text-[10px] uppercase tracking-widest mb-1 font-semibold text-gray-500">
                        {fact.label}
                      </p>
                      <p className="text-[14px] font-medium text-foreground">
                        {fact.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Related articles */}
            {relatedArticles.length > 0 && (
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <h2 className="text-lg font-bold">Articles lies</h2>
                  <div className="flex-1 h-px bg-black/8" />
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
                <div className="bg-white rounded-xl shadow-[0_4px_40px_-12px_rgba(0,0,0,0.06)] border border-black/4 p-6">
                  <h2 className="text-[11px] uppercase tracking-[0.18em] text-gray-500 font-bold mb-3">
                    Fiche d&apos;identite
                  </h2>
                  <div className="divide-y divide-black/5">
                    {enterprise.headquarters && (
                      <InfoRow
                        icon={MapPin}
                        label="Siege"
                        value={enterprise.headquarters}
                      />
                    )}
                    {enterprise.founded_year && (
                      <InfoRow
                        icon={Calendar}
                        label="Fondation"
                        value={String(enterprise.founded_year)}
                      />
                    )}
                    {ownership.length > 0 && (
                      <InfoRow
                        icon={Landmark}
                        label="Actionnariat"
                        value={
                          <ul className="space-y-1.5">
                            {ownership.map((share, idx) => (
                              <li
                                key={`${share.label}-${idx}`}
                                className="flex items-center gap-2"
                              >
                                <CountryFlag
                                  country={share.country}
                                  size={18}
                                />
                                <span>{share.label}</span>
                                {share.share != null && (
                                  <span className="text-gray-500 tabular-nums text-[13px]">
                                    {share.share}%
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        }
                      />
                    )}
                    {enterprise.employees && (
                      <InfoRow
                        icon={Users}
                        label="Effectifs"
                        value={enterprise.employees}
                      />
                    )}
                    {enterprise.revenue && (
                      <InfoRow
                        icon={DollarSign}
                        label="Chiffre d'affaires"
                        value={enterprise.revenue}
                      />
                    )}
                    {enterprise.website && (
                      <div className="py-3">
                        <a
                          href={enterprise.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-[13px] font-bold text-foreground hover:text-foreground/70 transition-colors border-b-2 border-gold pb-0.5"
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

              {/* CTA retour atlas */}
              <div className="bg-[#0a0a0a] text-white rounded-xl p-6">
                <p className="text-[13px] text-white/70 mb-3">
                  Explorer les autres piliers de l&apos;economie nigerienne
                </p>
                <Link
                  href="/entreprises"
                  className="inline-flex items-center gap-2 text-[13px] font-semibold text-gold hover:text-white transition-colors"
                >
                  Atlas economique du Niger
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

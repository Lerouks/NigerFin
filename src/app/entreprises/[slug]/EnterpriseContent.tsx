'use client';

import Link from 'next/link';
import {
  ArrowLeft, Building2, MapPin, Calendar, Users, Globe, DollarSign,
  Landmark, ExternalLink, ChevronRight,
} from 'lucide-react';
import { ArticleCard } from '@/components/ArticleCard';
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
}

interface EnterpriseContentProps {
  enterprise: Enterprise;
  relatedArticles: Article[];
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="w-8 h-8 rounded-lg bg-[#f5f5f0] flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-gray-500" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-[0.1em] text-gray-400">{label}</p>
        <p className="text-[14px] text-gray-800 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export function EnterpriseContent({ enterprise, relatedArticles }: EnterpriseContentProps) {
  const hasInfo = enterprise.full_name || enterprise.founded_year || enterprise.headquarters
    || enterprise.ownership || enterprise.employees || enterprise.revenue || enterprise.website;

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Header */}
      <div className="bg-[#111] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
          <Link
            href="/entreprises"
            className="inline-flex items-center gap-1.5 text-[13px] text-white/50 hover:text-white/80 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Entreprises
          </Link>

          <div className="flex items-start gap-5">
            {/* Logo */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/[0.08] border border-white/[0.1] flex items-center justify-center flex-shrink-0">
              {enterprise.logo_url ? (
                <img
                  src={enterprise.logo_url}
                  alt={`Logo ${enterprise.name}`}
                  className="w-12 h-12 sm:w-14 sm:h-14 object-contain"
                />
              ) : (
                <span className="text-2xl sm:text-3xl font-bold text-white/20">
                  {enterprise.name.charAt(0)}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-4xl font-bold leading-tight">{enterprise.name}</h1>
              {enterprise.full_name && enterprise.full_name !== enterprise.name && (
                <p className="text-[14px] sm:text-[16px] text-white/50 mt-1">{enterprise.full_name}</p>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-medium rounded-full bg-[#d4a843]/20 text-[#d4a843] ring-1 ring-inset ring-[#d4a843]/30">
                  <Building2 className="w-3 h-3" />
                  {enterprise.sector}
                </span>
                {enterprise.founded_year && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] text-white/40 rounded-full ring-1 ring-inset ring-white/10">
                    <Calendar className="w-3 h-3" />
                    Depuis {enterprise.founded_year}
                  </span>
                )}
                {enterprise.headquarters && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] text-white/40 rounded-full ring-1 ring-inset ring-white/10">
                    <MapPin className="w-3 h-3" />
                    {enterprise.headquarters}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div className="bg-white rounded-xl shadow-[0_4px_40px_-12px_rgba(0,0,0,0.08)] p-6 sm:p-8">
              <h2 className="text-[12px] uppercase tracking-[0.15em] text-gray-400 mb-4">Presentation</h2>
              <p className="text-[15px] leading-relaxed text-gray-700">
                {enterprise.detailed_description || enterprise.description}
              </p>
            </div>

            {/* Key facts */}
            {enterprise.key_facts && enterprise.key_facts.length > 0 && (
              <div className="bg-white rounded-xl shadow-[0_4px_40px_-12px_rgba(0,0,0,0.08)] p-6 sm:p-8">
                <h2 className="text-[12px] uppercase tracking-[0.15em] text-gray-400 mb-4">Points cles</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {enterprise.key_facts.map((fact, i) => (
                    <div key={i} className="p-4 rounded-lg bg-[#f5f5f0] border border-black/[0.04]">
                      <p className="text-[11px] uppercase tracking-[0.1em] text-gray-400 mb-1">{fact.label}</p>
                      <p className="text-[14px] font-medium text-gray-800">{fact.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Related articles */}
            {relatedArticles.length > 0 && (
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <h2 className="text-lg font-semibold">Articles lies</h2>
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
                  <h2 className="text-[12px] uppercase tracking-[0.15em] text-gray-400 mb-3">Fiche d&apos;identite</h2>
                  <div className="divide-y divide-black/[0.04]">
                    {enterprise.full_name && (
                      <InfoRow icon={Building2} label="Nom complet" value={enterprise.full_name} />
                    )}
                    {enterprise.headquarters && (
                      <InfoRow icon={MapPin} label="Siege" value={enterprise.headquarters} />
                    )}
                    {enterprise.founded_year && (
                      <InfoRow icon={Calendar} label="Fondation" value={String(enterprise.founded_year)} />
                    )}
                    {enterprise.ownership && (
                      <InfoRow icon={Landmark} label="Actionnariat" value={enterprise.ownership} />
                    )}
                    {enterprise.employees && (
                      <InfoRow icon={Users} label="Employes" value={enterprise.employees} />
                    )}
                    {enterprise.revenue && (
                      <InfoRow icon={DollarSign} label="Chiffre d'affaires" value={enterprise.revenue} />
                    )}
                    {enterprise.website && (
                      <div className="py-3">
                        <a
                          href={enterprise.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-[13px] text-[#d4a843] hover:text-[#c49a3a] font-medium transition-colors"
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

              {/* CTA */}
              <div className="bg-[#111] text-white rounded-xl p-6">
                <p className="text-[13px] text-white/60 mb-3">
                  Vous souhaitez suivre l&apos;actualite de cette entreprise ?
                </p>
                <Link
                  href="/entreprises"
                  className="inline-flex items-center gap-2 text-[13px] font-medium text-[#d4a843] hover:text-[#e5b854] transition-colors"
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

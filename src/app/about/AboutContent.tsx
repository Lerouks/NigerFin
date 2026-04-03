'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Loader2 } from 'lucide-react';

interface Section {
  id: string;
  heading: string;
  text: string;
  display_order: number;
}

export function AboutContent() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/legal-sections?page=about')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setSections(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getSection = (order: number) => sections.find((s) => s.display_order === order);

  const mission = getSection(1);
  const values = [getSection(2), getSection(3), getSection(4)].filter(Boolean) as Section[];
  const founders = [getSection(5), getSection(6)].filter(Boolean) as Section[];
  const coverage = getSection(7);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const coverageSectors = coverage?.text
    ? coverage.text.split(/,\s*|;\s*/).map((s) => s.replace(/^(Nous couvrons.*:\s*)/i, '').trim()).filter(Boolean)
    : [
        'Économie générale', 'Marchés financiers', 'Finance et investissement', 'Entreprises et startups',
        'Technologie et innovation', 'Agriculture et agro-industrie', 'Énergie et ressources naturelles',
        'Commerce et international', 'Éducation financière et économique', 'Outils pratiques de gestion',
      ];

  const getInitials = (heading: string) => {
    const namePart = heading.split('—')[0]?.trim() || heading;
    return namePart.split(/\s+/).map((w) => w[0]).filter(Boolean).join('').toUpperCase().slice(0, 2);
  };

  const getFounderName = (heading: string) => heading.split('—')[0]?.trim() || heading;
  const getFounderRole = (heading: string) => heading.split('—')[1]?.trim() || 'Co-fondateur';

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Hero */}
      <section className="bg-[#0d0d0d] text-white py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 hero-grid-pattern" />
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-gold/[0.03] rounded-full blur-3xl" />

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <Image
            src="/logo-about.png"
            alt="NFI Report"
            width={160}
            height={114}
            className="mb-8 mx-auto animate-fade-in"
            priority
          />
          <div className="inline-flex items-center gap-2.5 mb-4 animate-fade-in delay-100">
            <div className="h-[1px] w-8 bg-gold/50" />
            <span className="text-[11px] tracking-[0.2em] uppercase text-gold/60 font-semibold">À propos</span>
            <div className="h-[1px] w-8 bg-gold/50" />
          </div>
          <h1 className="text-4xl md:text-5xl mb-5 leading-[1.1] animate-fade-in-up delay-150">
            L&apos;information économique qui fait avancer l&apos;Afrique
          </h1>
          <p className="text-[17px] text-white/45 max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-200">
            Votre source d&apos;information économique et financière de référence pour le Niger et l&apos;Afrique.
          </p>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="py-20 md:py-28 bg-[#fafaf9]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {mission && (
            <div className="mb-20 text-center">
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="h-[1px] w-10 bg-gold/30" />
                <span className="text-[11px] tracking-[0.15em] uppercase text-gold font-semibold">Notre mission</span>
                <div className="h-[1px] w-10 bg-gold/30" />
              </div>
              <h2 className="text-3xl mb-6">Éclairer les décisions</h2>
              {mission.text.split('\n').filter(Boolean).length > 1
                ? mission.text.split('\n').filter(Boolean).map((p, i) => (
                    <p key={i} className="text-gray-600 text-lg leading-relaxed mb-4">{p}</p>
                  ))
                : <p className="text-gray-600 text-lg leading-relaxed">{mission.text}</p>
              }
            </div>
          )}

          {values.length > 0 && (
            <div className="mb-20 text-center">
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="h-[1px] w-10 bg-gold/30" />
                <span className="text-[11px] tracking-[0.15em] uppercase text-gold font-semibold">Nos valeurs</span>
                <div className="h-[1px] w-10 bg-gold/30" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">
                {values.map((v, i) => (
                  <div key={v.id} className="bg-white rounded-xl border border-black/[0.06] p-6 text-left hover:border-gold/20 hover:shadow-lg hover:shadow-gold/[0.04] transition-all duration-300 group"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="w-8 h-[2px] bg-gold/40 mb-4 group-hover:w-12 transition-all duration-300" />
                    <h3 className="text-xl mb-3 font-semibold">{v.heading}</h3>
                    <p className="text-gray-600 text-[15px] leading-relaxed">{v.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {founders.length > 0 && (
            <div className="mb-20 text-center">
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="h-[1px] w-10 bg-gold/30" />
                <span className="text-[11px] tracking-[0.15em] uppercase text-gold font-semibold">Fondateurs</span>
                <div className="h-[1px] w-10 bg-gold/30" />
              </div>
              <h2 className="text-3xl mb-8">Les visionnaires derrière NFI Report</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {founders.map((f) => (
                  <div key={f.id} className="bg-white rounded-xl border border-black/[0.06] p-7 text-left hover:shadow-lg transition-all duration-300 group">
                    <div className="w-16 h-16 bg-[#111] text-white rounded-full flex items-center justify-center text-xl font-semibold mb-4 mx-auto group-hover:bg-gold transition-colors duration-300">
                      {getInitials(f.heading)}
                    </div>
                    <h3 className="text-xl font-semibold mb-1 text-center">{getFounderName(f.heading)}</h3>
                    <p className="text-[13px] text-gold mb-3 text-center">{getFounderRole(f.heading)}</p>
                    <p className="text-gray-600 text-[15px] leading-relaxed">{f.text}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-xl border border-black/[0.06] p-8 relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
                <p className="text-gray-600 text-[18px] italic leading-relaxed">
                  &ldquo;Nous croyons fermement au potentiel économique de l&apos;Afrique et nous nous engageons à être les catalyseurs de cette transformation en fournissant l&apos;information qui compte.&rdquo;
                </p>
              </div>
            </div>
          )}

          {coverage && (
            <div>
              <h2 className="text-3xl mb-6">{coverage.heading}</h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">Nous couvrons l&apos;ensemble des secteurs économiques clés :</p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {coverageSectors.map((sector) => (
                  <li key={sector} className="flex items-center gap-3 py-2.5 px-4 bg-white rounded-lg border border-black/[0.04] hover:border-gold/20 hover:bg-gold/[0.02] transition-all duration-200">
                    <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                    <span className="text-gray-700">{sector}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#0d0d0d] text-white py-16 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 hero-grid-pattern" />
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="text-3xl mb-4">Rejoignez notre communauté</h2>
          <p className="text-white/40 text-[15px] mb-8 max-w-lg mx-auto">
            Restez informé des dernières actualités économiques et financières
          </p>
          <Link href="/" className="inline-flex items-center gap-2 bg-white text-black px-7 py-3 rounded-full hover:bg-gold hover:text-white transition-all duration-300 text-[14px] font-medium">
            Découvrir nos articles
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

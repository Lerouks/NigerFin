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

  // Parse coverage sectors from text
  const coverageSectors = coverage?.text
    ? coverage.text.split(/,\s*|;\s*/).map((s) => s.replace(/^(Nous couvrons.*:\s*)/i, '').trim()).filter(Boolean)
    : [
        'Économie générale', 'Marchés financiers', 'Finance et investissement', 'Entreprises et startups',
        'Technologie et innovation', 'Agriculture et agro-industrie', 'Énergie et ressources naturelles',
        'Commerce et international', 'Éducation financière et économique', 'Outils pratiques de gestion',
      ];

  // Extract initials from founder name
  const getInitials = (heading: string) => {
    const namePart = heading.split('—')[0]?.trim() || heading;
    return namePart.split(/\s+/).map((w) => w[0]).filter(Boolean).join('').toUpperCase().slice(0, 2);
  };

  const getFounderName = (heading: string) => heading.split('—')[0]?.trim() || heading;
  const getFounderRole = (heading: string) => heading.split('—')[1]?.trim() || 'Co-fondateur';

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <section className="bg-[#111] text-white py-20 md:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Image
            src="/logo-about.png"
            alt="NFI Report"
            width={160}
            height={114}
            className="mb-8 mx-auto"
            priority
          />
          <span className="text-[11px] tracking-[0.2em] uppercase text-white/40 block mb-4">À propos</span>
          <h1 className="text-4xl md:text-5xl mb-5 leading-[1.1]">
            L&apos;information économique qui fait avancer l&apos;Afrique
          </h1>
          <p className="text-[17px] text-white/50 max-w-2xl mx-auto leading-relaxed">
            Votre source d&apos;information économique et financière de référence pour le Niger et l&apos;Afrique.
          </p>
        </div>
      </section>

      <section className="py-20 md:py-28 bg-[#fafaf9]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {mission && (
            <div className="mb-20 text-center">
              <span className="text-[11px] tracking-[0.15em] uppercase text-gray-400 block mb-4">Notre mission</span>
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
              <span className="text-[11px] tracking-[0.15em] uppercase text-gray-400 block mb-4">Nos valeurs</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {values.map((v) => (
                  <div key={v.id} className="bg-white rounded-xl border border-black/[0.06] p-6 text-left">
                    <h3 className="text-xl mb-3 font-semibold">{v.heading}</h3>
                    <p className="text-gray-600">{v.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {founders.length > 0 && (
            <div className="mb-20 text-center">
              <span className="text-[11px] tracking-[0.15em] uppercase text-gray-400 block mb-4">Fondateurs</span>
              <h2 className="text-3xl mb-8">Les visionnaires derrière NFI Report</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {founders.map((f) => (
                  <div key={f.id} className="bg-white rounded-xl border border-black/[0.06] p-7 text-left">
                    <div className="w-16 h-16 bg-[#111] text-white rounded-full flex items-center justify-center text-xl font-semibold mb-4 mx-auto">
                      {getInitials(f.heading)}
                    </div>
                    <h3 className="text-xl font-semibold mb-1 text-center">{getFounderName(f.heading)}</h3>
                    <p className="text-[13px] text-gray-400 mb-3 text-center">{getFounderRole(f.heading)}</p>
                    <p className="text-gray-600 text-[15px] leading-relaxed">{f.text}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-xl border border-black/[0.06] p-8">
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
                  <li key={sector} className="flex items-center gap-3 py-2.5 px-4 bg-white rounded-lg border border-black/[0.04]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#111]" />
                    <span className="text-gray-700">{sector}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <section className="bg-[#111] text-white py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl mb-4">Rejoignez notre communauté</h2>
          <p className="text-white/45 text-[15px] mb-8 max-w-lg mx-auto">
            Restez informé des dernières actualités économiques et financières
          </p>
          <Link href="/" className="inline-flex items-center gap-2 bg-white text-black px-7 py-3 rounded-full hover:bg-white/90 transition-colors text-[14px]">
            Découvrir nos articles
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

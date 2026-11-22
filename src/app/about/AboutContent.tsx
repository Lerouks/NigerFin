import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface Section {
  id: string;
  heading: string;
  text: string;
  display_order: number;
}

export function AboutContent({ sections }: { sections: Section[] }) {
  const getSection = (order: number) => sections.find((s) => s.display_order === order);

  const mission = getSection(1);
  const values = [getSection(2), getSection(3), getSection(4)].filter(Boolean) as Section[];
  // Pas de bloc « fondateurs » : aucun nom de personne sur NFI (décision du
  // 22/11/2026). Les entrées 5 et 6 de la base ont été retirées.
  const coverage = getSection(7);

  const coverageSectors = coverage?.text
    ? coverage.text.split(/,\s*|;\s*/).map((s) => s.replace(/^(Nous couvrons.*:\s*)/i, '').trim()).filter(Boolean)
    : [
        'Économie du Niger', 'Énergie et ressources naturelles', 'Banques et finance',
        'Bourse et marchés', 'Entreprises', 'Éducation financière',
      ];

  return (
    <>
      {/* Mission & Values */}
      <section className="py-20 md:py-28 bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {mission && (
            <div className="mb-20 text-center">
              <div className="inline-flex items-center gap-3 mb-4">
                <span className="text-[11px] tracking-[0.15em] uppercase text-gold font-semibold">Notre mission</span>
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
                <span className="text-[11px] tracking-[0.15em] uppercase text-gold font-semibold">Nos valeurs</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">
                {values.map((v, i) => (
                  <div key={v.id} className="bg-white rounded-xl border border-black/6 p-6 text-left hover:border-gold/20 hover:shadow-lg hover:shadow-gold/4 transition-all duration-300 group"
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

          {coverage && (
            <div>
              <h2 className="text-3xl mb-6">{coverage.heading}</h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">Les secteurs de l&apos;économie nigérienne que nous suivons :</p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {coverageSectors.map((sector) => (
                  <li key={sector} className="flex items-center gap-3 py-2.5 px-4 bg-white rounded-lg border border-black/4 hover:border-gold/20 hover:bg-gold/2 transition-all duration-200">
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
        <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-gold/30 to-transparent" />
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
    </>
  );
}

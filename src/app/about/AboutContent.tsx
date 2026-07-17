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
  const founders = [getSection(5), getSection(6)].filter(Boolean) as Section[];
  const coverage = getSection(7);

  const coverageSectors = coverage?.text
    ? coverage.text.split(/,\s*|;\s*/).map((s) => s.replace(/^(Nous couvrons.*:\s*)/i, '').trim()).filter(Boolean)
    : [
        'Économie générale', 'Marchés financiers', 'Finance et investissement', 'Entreprises et startups',
        'Technologie et innovation', 'Agriculture et agro-industrie', 'Énergie et ressources naturelles',
        'Commerce et international', 'Éducation financière et économique', 'Outils pratiques de gestion',
      ];

  // Split convention : "Name · Role" (le séparateur est le middle dot U+00B7)
  const splitFounder = (heading: string) => {
    const parts = heading.split(' · ');
    return {
      name: parts[0]?.trim() || heading,
      role: parts[1]?.trim() || 'Co-fondateur',
    };
  };

  const getInitials = (heading: string) => {
    const { name } = splitFounder(heading);
    return name.split(/\s+/).map((w) => w[0]).filter(Boolean).join('').toUpperCase().slice(0, 2);
  };

  const getFounderName = (heading: string) => splitFounder(heading).name;
  const getFounderRole = (heading: string) => splitFounder(heading).role;

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

          {founders.length > 0 && (
            <div className="mb-20 text-center">
              <div className="inline-flex items-center gap-3 mb-4">
                <span className="text-[11px] tracking-[0.15em] uppercase text-gold font-semibold">Fondateurs</span>
              </div>
              <h2 className="text-3xl mb-8">Qui est derrière NFI Report</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {founders.map((f) => (
                  <div key={f.id} className="bg-white rounded-xl border border-black/6 p-7 text-left hover:shadow-lg transition-all duration-300 group">
                    <div className="w-16 h-16 bg-[#111] text-white rounded-full flex items-center justify-center text-xl font-semibold mb-4 mx-auto group-hover:bg-gold transition-colors duration-300">
                      {getInitials(f.heading)}
                    </div>
                    <h3 className="text-xl font-semibold mb-1 text-center">{getFounderName(f.heading)}</h3>
                    <p className="text-[13px] text-gold mb-3 text-center">{getFounderRole(f.heading)}</p>
                    <p className="text-gray-600 text-[15px] leading-relaxed text-pretty">{f.text}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-xl border border-black/6 p-8 relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-[2px] bg-linear-to-r from-transparent via-gold/30 to-transparent" />
                <p className="text-gray-600 text-[18px] italic leading-relaxed">
                  &ldquo;Nous croyons fermement au potentiel économique de l&apos;Afrique et nous nous engageons à être les catalyseurs de cette transformation en fournissant l&apos;information qui compte.&rdquo;
                </p>
              </div>
            </div>
          )}

          {coverage && (
            <div>
              <h2 className="text-3xl mb-6">{coverage.heading}</h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">Nous couvrons l&apos;ensemble des secteurs économiques clés :</p>
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

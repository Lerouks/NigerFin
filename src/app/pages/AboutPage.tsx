import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router';

export function AboutPage() {
  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Hero Section */}
      <section className="bg-[#111] text-white py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-[11px] tracking-[0.2em] uppercase text-white/40 block mb-4">À propos</span>
          <h1 className="text-4xl md:text-5xl mb-5 leading-[1.1]">
            L'information économique qui fait avancer l'Afrique
          </h1>
          <p className="text-[17px] text-white/50 max-w-2xl leading-relaxed">
            Votre source d'information économique et financière de référence pour
            le Niger et l'Afrique.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mission */}
          <div className="mb-20">
            <span className="text-[11px] tracking-[0.15em] uppercase text-gray-400 block mb-4">Notre mission</span>
            <h2 className="text-3xl mb-6">Éclairer les décisions</h2>
            <p className="text-gray-600 text-lg leading-relaxed mb-4">
              Nous sommes dédiés à fournir une information économique et financière
              de qualité, précise et pertinente pour les professionnels, investisseurs
              et décideurs au Niger et en Afrique.
            </p>
            <p className="text-gray-600 text-lg leading-relaxed">
              Notre objectif est de contribuer au développement économique du
              continent en offrant des analyses approfondies, des données de marché
              en temps réel et des outils pratiques pour la prise de décision.
            </p>
          </div>

          {/* Values */}
          <div className="mb-20">
            <span className="text-[11px] tracking-[0.15em] uppercase text-gray-400 block mb-4">Nos valeurs</span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-white rounded-xl border border-black/[0.06] p-6">
                <h3 className="text-xl mb-3">Excellence</h3>
                <p className="text-gray-600">
                  Nous nous engageons à fournir un contenu de la plus haute qualité,
                  vérifié et sourcé.
                </p>
              </div>
              <div className="bg-white rounded-xl border border-black/[0.06] p-6">
                <h3 className="text-xl mb-3">Intégrité</h3>
                <p className="text-gray-600">
                  Notre indépendance éditoriale garantit une information objective
                  et fiable.
                </p>
              </div>
              <div className="bg-white rounded-xl border border-black/[0.06] p-6">
                <h3 className="text-xl mb-3">Innovation</h3>
                <p className="text-gray-600">
                  Nous développons des outils innovants pour accompagner les
                  professionnels africains.
                </p>
              </div>
            </div>
          </div>

          {/* Team */}
          <div className="mb-20">
            <h2 className="text-3xl mb-6">Notre Équipe</h2>
            <p className="text-gray-600 text-lg leading-relaxed mb-8">
              Notre équipe est composée de journalistes économiques expérimentés,
              d'analystes financiers et de développeurs passionnés par le
              développement de l'Afrique.
            </p>
            <div className="bg-white rounded-xl border border-black/[0.06] p-8">
              <p className="text-gray-600 text-[18px] italic leading-relaxed">
                "Nous croyons fermement au potentiel économique de l'Afrique et
                nous nous engageons à être les catalyseurs de cette transformation
                en fournissant l'information qui compte."
              </p>
            </div>
          </div>

          {/* Coverage */}
          <div>
            <h2 className="text-3xl mb-6">Notre Couverture</h2>
            <p className="text-gray-600 text-lg leading-relaxed mb-6">
              Nous couvrons l'ensemble des secteurs économiques clés :
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                'Économie générale',
                'Marchés financiers',
                'Finance et investissement',
                'Entreprises et startups',
                'Technologie et innovation',
                'Agriculture et agro-industrie',
                'Énergie et ressources naturelles',
                'Commerce et international',
                'Éducation financière et économique',
                'Outils pratiques de gestion',
              ].map((sector, index) => (
                <li key={index} className="flex items-center gap-3 py-2.5 px-4 bg-white rounded-lg border border-black/[0.04]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#111]"></div>
                  <span className="text-gray-700">{sector}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#111] text-white py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl mb-4">Rejoignez notre communauté</h2>
          <p className="text-white/45 text-[15px] mb-8 max-w-lg mx-auto">
            Restez informé des dernières actualités économiques et financières
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-white text-black px-7 py-3 rounded-full hover:bg-white/90 transition-colors text-[14px]"
          >
            Découvrir nos articles
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
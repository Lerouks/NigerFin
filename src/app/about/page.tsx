import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'À propos',
  description: "Découvrez NFI Report, votre source d'information économique et financière de référence pour le Niger et l'Afrique.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <section className="bg-[#111] text-white py-20 md:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Image
            src="/logo-white.png"
            alt="NFI Report"
            width={120}
            height={36}
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
          <div className="mb-20 text-center">
            <span className="text-[11px] tracking-[0.15em] uppercase text-gray-400 block mb-4">Notre mission</span>
            <h2 className="text-3xl mb-6">Éclairer les décisions</h2>
            <p className="text-gray-600 text-lg leading-relaxed mb-4">
              Nous sommes dédiés à fournir une information économique et financière de qualité, précise et pertinente pour les professionnels, investisseurs et décideurs au Niger et en Afrique.
            </p>
            <p className="text-gray-600 text-lg leading-relaxed">
              Notre objectif est de contribuer au développement économique du continent en offrant des analyses approfondies, des données de marché en temps réel et des outils pratiques pour la prise de décision.
            </p>
          </div>

          <div className="mb-20 text-center">
            <span className="text-[11px] tracking-[0.15em] uppercase text-gray-400 block mb-4">Nos valeurs</span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { title: 'Excellence', text: 'Nous nous engageons à fournir un contenu de la plus haute qualité, vérifié et sourcé.' },
                { title: 'Intégrité', text: 'Notre indépendance éditoriale garantit une information objective et fiable.' },
                { title: 'Innovation', text: 'Nous développons des outils innovants pour accompagner les professionnels africains.' },
              ].map((v) => (
                <div key={v.title} className="bg-white rounded-xl border border-black/[0.06] p-6 text-left">
                  <h3 className="text-xl mb-3 font-semibold">{v.title}</h3>
                  <p className="text-gray-600">{v.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-20 text-center">
            <span className="text-[11px] tracking-[0.15em] uppercase text-gray-400 block mb-4">Fondateurs</span>
            <h2 className="text-3xl mb-8">Les visionnaires derrière NFI Report</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-xl border border-black/[0.06] p-7 text-left">
                <div className="w-16 h-16 bg-[#111] text-white rounded-full flex items-center justify-center text-xl font-semibold mb-4 mx-auto">RB</div>
                <h3 className="text-xl font-semibold mb-1 text-center">Raouf B.</h3>
                <p className="text-[13px] text-gray-400 mb-3 text-center">Co-fondateur</p>
                <p className="text-gray-600 text-[15px] leading-relaxed">
                  Entrepreneur engagé et fin observateur des dynamiques économiques régionales, Raouf est à l&apos;origine de la vision fondatrice de NFI REPORT. Convaincu que l&apos;Afrique mérite une presse économique d&apos;excellence, il oeuvre à construire une plateforme indépendante capable d&apos;éclairer investisseurs, dirigeants et institutions.
                </p>
              </div>
              <div className="bg-white rounded-xl border border-black/[0.06] p-7 text-left">
                <div className="w-16 h-16 bg-[#111] text-white rounded-full flex items-center justify-center text-xl font-semibold mb-4 mx-auto">IS</div>
                <h3 className="text-xl font-semibold mb-1 text-center">Ibrahim S.</h3>
                <p className="text-[13px] text-gray-400 mb-3 text-center">Co-fondateur</p>
                <p className="text-gray-600 text-[15px] leading-relaxed">
                  Ingénieur et entrepreneur engagé dans le développement économique africain, Ibrahim structure la vision stratégique de NFI REPORT. Son approche analytique, inspirée des standards internationaux, vise à élever le débat économique au Niger et en Afrique en proposant une information indépendante, rigoureuse et orientée vers l&apos;action.
                </p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-black/[0.06] p-8">
              <p className="text-gray-600 text-[18px] italic leading-relaxed">
                &ldquo;Nous croyons fermement au potentiel économique de l&apos;Afrique et nous nous engageons à être les catalyseurs de cette transformation en fournissant l&apos;information qui compte.&rdquo;
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-3xl mb-6">Notre Couverture</h2>
            <p className="text-gray-600 text-lg leading-relaxed mb-6">Nous couvrons l&apos;ensemble des secteurs économiques clés :</p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                'Économie générale', 'Marchés financiers', 'Finance et investissement', 'Entreprises et startups',
                'Technologie et innovation', 'Agriculture et agro-industrie', 'Énergie et ressources naturelles',
                'Commerce et international', 'Éducation financière et économique', 'Outils pratiques de gestion',
              ].map((sector) => (
                <li key={sector} className="flex items-center gap-3 py-2.5 px-4 bg-white rounded-lg border border-black/[0.04]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#111]" />
                  <span className="text-gray-700">{sector}</span>
                </li>
              ))}
            </ul>
          </div>
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

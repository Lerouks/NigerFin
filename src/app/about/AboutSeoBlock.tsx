import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function AboutSeoBlock() {
  return (
    <section className="bg-white border-t border-black/[0.06]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="prose prose-sm sm:prose-base max-w-none">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#111] mb-4">
            Pourquoi NFI Report existe
          </h2>
          <p className="text-[15px] sm:text-[16px] leading-relaxed text-gray-700 mb-6">
            Le Niger figure parmi les pays les moins couverts médiatiquement au monde. Les
            informations économiques et financières disponibles sur le pays restent rares,
            fragmentées, souvent en anglais ou pensées pour un lectorat international. Côté
            local, les ressources éditoriales spécialisées en économie sont limitées, alors
            même que la demande explose : jeunes diplômés qui veulent investir, entrepreneurs
            qui cherchent à se financer, cadres qui veulent comprendre la conjoncture, diaspora
            qui suit le pays depuis l&apos;étranger.
          </p>
          <p className="text-[15px] sm:text-[16px] leading-relaxed text-gray-700 mb-10">
            NFI Report a été lancé pour combler ce manque. Chaque jour, nous publions des
            analyses contextualisées sur l&apos;économie nigérienne, les marchés financiers
            ouest-africains, les entreprises stratégiques du pays, l&apos;actualité de la zone
            UEMOA et les grandes tendances qui façonnent l&apos;Afrique de l&apos;Ouest. Notre
            ambition : devenir la référence francophone de l&apos;information économique et
            financière sur le Niger et la sous-région.
          </p>

          <h2 className="text-2xl sm:text-3xl font-bold text-[#111] mt-10 mb-4">
            Nos lignes éditoriales
          </h2>
          <ul className="space-y-3 text-[15px] sm:text-[16px] text-gray-700 mb-10">
            <li className="flex items-start gap-3">
              <span className="mt-2 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-gold" />
              <span className="leading-relaxed">
                <strong>Économie nigérienne</strong> : croissance du PIB, inflation, dette
                publique, balance commerciale, secteurs stratégiques (agriculture, mines,
                énergie, services).
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-gold" />
              <span className="leading-relaxed">
                <strong>Finance et marchés</strong> : BRVM, banques nigériennes, microfinance,
                Mobile Money, fintechs, taux directeurs BCEAO, politiques monétaires UEMOA.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-gold" />
              <span className="leading-relaxed">
                <strong>Entreprises stratégiques</strong> : SOMAÏR, COMINAK, NIGELEC, SONIBANK,
                SONIDEP, BAGRI, SOPAMIN, Niger Telecoms et le tissu des PME locales.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-gold" />
              <span className="leading-relaxed">
                <strong>Éducation financière</strong> : cours et leçons gratuits adaptés au
                contexte nigérien et UEMOA, du débutant à l&apos;investisseur averti.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-gold" />
              <span className="leading-relaxed">
                <strong>Outils pratiques</strong> : simulateurs financiers (emprunt, salaire,
                budget familial, intérêts) calibrés sur les réalités du Niger.
              </span>
            </li>
          </ul>

          <h2 className="text-2xl sm:text-3xl font-bold text-[#111] mt-10 mb-4">
            Pour qui écrivons-nous
          </h2>
          <p className="text-[15px] sm:text-[16px] leading-relaxed text-gray-700 mb-6">
            Notre audience est large mais nos lecteurs partagent un point commun : ils veulent
            comprendre l&apos;économie pour mieux décider. Cela inclut des étudiants en
            économie ou finance qui préparent leur entrée dans la vie active, des jeunes
            diplômés qui veulent investir leur première épargne, des cadres et dirigeants
            d&apos;entreprises qui pilotent leur stratégie dans un environnement complexe, des
            entrepreneurs qui cherchent à se financer, des investisseurs particuliers ou
            institutionnels qui s&apos;intéressent au marché ouest-africain, et des membres
            de la diaspora nigérienne qui suivent le pays depuis l&apos;étranger.
          </p>
          <p className="text-[15px] sm:text-[16px] leading-relaxed text-gray-700 mb-8">
            Nous écrivons aussi pour les journalistes, chercheurs et organisations
            internationales qui ont besoin d&apos;analyses contextualisées et fiables sur le
            Niger et la zone UEMOA. Notre objectif : démocratiser l&apos;accès à
            l&apos;information économique de qualité, sans jargon inutile, sans simplification
            excessive.
          </p>

          <Link
            href="/contact"
            className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#111] hover:text-gold transition-colors"
          >
            Nous contacter
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

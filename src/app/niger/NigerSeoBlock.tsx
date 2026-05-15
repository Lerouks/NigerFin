const PARAGRAPHS = [
  "Le Niger est un pays sahélien enclavé d'Afrique de l'Ouest, frontalier du Nigeria, du Bénin, du Burkina Faso, du Mali, de l'Algérie, de la Libye et du Tchad. Avec une superficie de 1 267 000 km² (deux fois la France), il abrite environ 27 millions d'habitants et figure parmi les pays les plus jeunes au monde, avec un âge médian sous 15 ans et un taux de fécondité parmi les plus élevés de la planète. Sa croissance démographique soutenue (autour de 3,8% par an) en fait l'un des pays au plus fort potentiel de marché intérieur du Sahel.",
  "L'économie nigérienne reste largement structurée autour de l'agriculture vivrière (mil, sorgho, niébé, arachide), de l'élevage et du secteur informel. Les exportations sont aujourd'hui dominées par le pétrole brut du champ d'Agadem, qui représente près de 90% des exportations nationales depuis l'inauguration du pipeline d'export tchado-béninois en 2024 et concentre l'essentiel des recettes en devises du pays. L'uranium (Arlit, Akouta), pilier historique des exportations nigériennes, et l'or extrait notamment dans la région du Liptako-Gourma, complètent le panier des matières premières exportées. Selon les Comptes Économiques de la Nation publiés par l'Institut National de la Statistique (INS) en avril 2026, le PIB du Niger atteint 18,8 milliards USD en 2025 avec une croissance de 6,9% (après 8,3% en 2024) et une inflation en moyenne annuelle de -4,7% (déflation).",
  "Le Niger est membre de la zone UEMOA (Union Économique et Monétaire Ouest-Africaine), partage le franc CFA arrimé à l'euro à parité fixe (655,957 FCFA pour 1 euro), et bénéficie d'un cadre monétaire stable géré par la BCEAO depuis Dakar. Le pays a quitté la CEDEAO le 28 janvier 2024 et a fondé avec le Mali et le Burkina Faso l'AES (Alliance des États du Sahel), transformée en Confédération des États du Sahel en juillet 2024. Le Niger reste membre de l'OCI (Organisation de la Coopération Islamique), de l'Union Africaine et de l'OAPI (Organisation Africaine de la Propriété Intellectuelle).",
  "Sur le plan administratif, le Niger compte 7 régions (Tillabéri, Dosso, Tahoua, Maradi, Zinder, Agadez, Diffa) auxquelles s'ajoute la ville-capitale de Niamey, collectivité à statut particulier. La région d'Agadez, la plus vaste, concentre les activités minières (uranium, sel, or) et touristiques (Aïr, Ténéré). Maradi est le poumon commercial du pays grâce à sa proximité avec le Nigeria voisin. Zinder, deuxième ville du pays, héberge la raffinerie SORAZ et constitue un nœud agro-industriel clé.",
  "Les défis économiques contemporains sont multiples : insécurité dans certaines régions (Sahel), faible diversification, dépendance aux matières premières, accès limité au financement long, infrastructures sous-développées et taux d'électrification parmi les plus bas d'Afrique. Mais le potentiel reste considérable : ressources minières et pétrolières prouvées, démographie dynamique, position géographique stratégique au cœur du Sahel, et intégration régionale UEMOA et AES qui ouvre un marché régional croissant.",
];

export function NigerSeoBlock() {
  return (
    <section className="bg-white border-t border-black/[0.06]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#111] mb-6">
          Profil économique du Niger en quelques chiffres
        </h2>
        <div className="prose prose-sm sm:prose-base max-w-none space-y-5">
          {PARAGRAPHS.map((p) => (
            <p key={p.slice(0, 32)} className="text-[15px] sm:text-[16px] leading-relaxed text-gray-700">
              {p}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

const PARAGRAPHS = [
  "Le Niger est un pays sahélien enclavé d'Afrique de l'Ouest, frontalier du Nigeria, du Bénin, du Burkina Faso, du Mali, de l'Algérie, de la Libye et du Tchad. Avec une superficie de 1 267 000 km² (deux fois la France), il abrite environ 27 millions d'habitants et figure parmi les pays les plus jeunes au monde, avec un âge médian sous 15 ans et un taux de fécondité parmi les plus élevés de la planète. Sa croissance démographique soutenue (autour de 3,8% par an) en fait l'un des pays au plus fort potentiel de marché intérieur du Sahel.",
  "L'économie nigérienne reste largement structurée autour de l'agriculture vivrière (mil, sorgho, niébé, arachide), de l'élevage et du secteur informel. Les exportations sont dominées historiquement par l'uranium (Arlit, Akouta), désormais complétées par le pétrole (champ d'Agadem) depuis l'inauguration du pipeline d'export tchado-béninois en 2024. L'or, extrait notamment dans la région du Liptako-Gourma, complète le panier des matières premières exportées.",
  "Le Niger est membre de la zone UEMOA (Union Économique et Monétaire Ouest-Africaine), partage le franc CFA arrimé à l'euro à parité fixe (655,957 FCFA pour 1 euro), et bénéficie d'un cadre monétaire stable géré par la BCEAO depuis Dakar. Le pays est également membre de la CEDEAO (Communauté Économique des États de l'Afrique de l'Ouest), de l'OCI (Organisation de la Coopération Islamique), de l'Union Africaine et de l'OAPI (Organisation Africaine de la Propriété Intellectuelle).",
  "Sur le plan administratif, le Niger compte 7 régions (Niamey, Tillabéri, Dosso, Tahoua, Maradi, Zinder, Agadez, Diffa), avec Niamey comme capitale économique et politique. La région d'Agadez, la plus vaste, concentre les activités minières (uranium, sel, or) et touristiques (Aïr, Ténéré). Maradi est le poumon commercial du pays grâce à sa proximité avec le Nigeria voisin. Zinder, deuxième ville du pays, héberge la raffinerie SORAZ et constitue un nœud agro-industriel clé.",
  "Les défis économiques contemporains sont multiples : insécurité dans certaines régions (Sahel), faible diversification, dépendance aux matières premières, accès limité au financement long, infrastructures sous-développées et taux d'électrification parmi les plus bas d'Afrique. Mais le potentiel reste considérable : ressources minières prouvées, démographie dynamique, position géographique stratégique au cœur du Sahel, et intégration régionale UEMOA/CEDEAO qui ouvre un marché de 400 millions de consommateurs.",
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

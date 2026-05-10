interface SeoContent {
  title: string;
  paragraphs: string[];
}

const SEO_CONTENT: Record<string, SeoContent> = {
  'presentation': {
    title: 'Profil économique du Niger en quelques chiffres',
    paragraphs: [
      "Le Niger est un pays sahélien enclavé d'Afrique de l'Ouest, frontalier du Nigeria, du Bénin, du Burkina Faso, du Mali, de l'Algérie, de la Libye et du Tchad. Avec une superficie de 1 267 000 km² (deux fois la France), il abrite environ 27 millions d'habitants et figure parmi les pays les plus jeunes au monde, avec un âge médian sous 15 ans et un taux de fécondité parmi les plus élevés de la planète. Sa croissance démographique soutenue (autour de 3,8% par an) en fait l'un des pays au plus fort potentiel de marché intérieur du Sahel.",
      "L'économie nigérienne reste largement structurée autour de l'agriculture vivrière (mil, sorgho, niébé, arachide), de l'élevage et du secteur informel. Les exportations sont dominées historiquement par l'uranium (Arlit, Akouta), désormais complétées par le pétrole (champ d'Agadem) depuis l'inauguration du pipeline d'export tchado-béninois en 2024. L'or, extrait notamment dans la région du Liptako-Gourma, complète le panier des matières premières exportées.",
      "Le Niger est membre de la zone UEMOA (Union Économique et Monétaire Ouest-Africaine), partage le franc CFA arrimé à l'euro à parité fixe (655,957 FCFA pour 1 euro), et bénéficie d'un cadre monétaire stable géré par la BCEAO depuis Dakar. Le pays est également membre de la CEDEAO (Communauté Économique des États de l'Afrique de l'Ouest), de l'OCI (Organisation de la Coopération Islamique), de l'Union Africaine et de l'OAPI (Organisation Africaine de la Propriété Intellectuelle).",
      "Sur le plan administratif, le Niger compte 7 régions (Niamey, Tillabéri, Dosso, Tahoua, Maradi, Zinder, Agadez, Diffa), avec Niamey comme capitale économique et politique. La région d'Agadez, la plus vaste, concentre les activités minières (uranium, sel, or) et touristiques (Aïr, Ténéré). Maradi est le poumon commercial du pays grâce à sa proximité avec le Nigeria voisin. Zinder, deuxième ville du pays, héberge la raffinerie SORAZ et constitue un nœud agro-industriel clé.",
      "Les défis économiques contemporains sont multiples : insécurité dans certaines régions (Sahel), faible diversification, dépendance aux matières premières, accès limité au financement long, infrastructures sous-développées et taux d'électrification parmi les plus bas d'Afrique. Mais le potentiel reste considérable : ressources minières prouvées, démographie dynamique, position géographique stratégique au cœur du Sahel, et intégration régionale UEMOA/CEDEAO qui ouvre un marché de 400 millions de consommateurs.",
    ],
  },
  'entreprises-strategiques': {
    title: 'Pourquoi ces 8 entreprises sont stratégiques pour le Niger',
    paragraphs: [
      "Les 8 entreprises stratégiques du Niger (SOMAÏR, COMINAK, NIGELEC, SONIBANK, SONIDEP, BAGRI, SOPAMIN, Niger Telecoms) ont été identifiées comme des piliers de l'économie nationale en raison de leur rôle structurant dans des secteurs critiques : énergie, mines, télécommunications, banque et hydrocarbures. Ensemble, elles emploient des dizaines de milliers de personnes directement et indirectement, génèrent une part significative des recettes fiscales de l'État et structurent toute une chaîne de valeur de sous-traitants, fournisseurs et partenaires locaux.",
      "Dans le secteur des mines, SOMAÏR (Société des Mines de l'Aïr) et COMINAK (Compagnie Minière d'Akouta) ont historiquement fait du Niger l'un des principaux producteurs mondiaux d'uranium, alimentant pendant des décennies les centrales nucléaires françaises et japonaises. SOPAMIN (Société du Patrimoine des Mines du Niger) gère les participations de l'État dans l'ensemble du secteur minier (uranium, or, charbon, pétrole), assurant la perception des dividendes et royalties qui alimentent le budget national.",
      "Dans l'énergie, NIGELEC (Société Nigérienne d'Électricité) est en charge de la production, du transport et de la distribution de l'électricité au Niger, un secteur encore largement déficitaire avec des taux d'accès parmi les plus bas d'Afrique de l'Ouest. SONIDEP (Société Nigérienne des Produits Pétroliers) est l'acteur central de la sécurité énergétique en aval, gérant l'importation, le stockage et la distribution des carburants raffinés sur tout le territoire.",
      "Dans le secteur bancaire, SONIBANK (Société Nigérienne de Banque) figure parmi les principales banques commerciales du Niger, présente dans toutes les grandes villes. BAGRI (Banque Agricole du Niger) cible spécifiquement le financement du secteur agricole et rural, secteur clé représentant 40% du PIB nigérien et employant la majorité de la population active. Ces deux établissements opèrent sous la supervision prudentielle de la BCEAO et de la Commission Bancaire de l'UEMOA.",
      "Enfin, Niger Telecoms est l'opérateur historique des télécommunications, issu de la fusion de la SONITEL et de SAHELCOM en 2017. Il exploite le réseau de fibre optique national et joue un rôle central dans la souveraineté numérique du pays, en complément des opérateurs privés Airtel, Moov Africa et Zamani. La transformation digitale du Niger (e-administration, paiements numériques, télémédecine) repose en grande partie sur les infrastructures déployées par Niger Telecoms.",
      "Le contexte géopolitique récent (transition politique de 2023, retrait des forces armées françaises, rapprochement avec la Russie, la Chine et la Turquie) redessine en profondeur les partenariats capitalistiques et stratégiques de plusieurs de ces entreprises. NFI Report suit en continu ces évolutions et leurs implications économiques pour le Niger et la sous-région ouest-africaine.",
    ],
  },
};

export function NigerSectionSeoBlock({ section }: { section: string }) {
  const content = SEO_CONTENT[section];
  if (!content) return null;

  return (
    <section className="bg-white border-t border-black/[0.06]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#111] mb-6">{content.title}</h2>
        <div className="prose prose-sm sm:prose-base max-w-none space-y-5">
          {content.paragraphs.map((p) => (
            <p key={p.slice(0, 32)} className="text-[15px] sm:text-[16px] leading-relaxed text-gray-700">
              {p}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

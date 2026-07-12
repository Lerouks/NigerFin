interface EnterpriseSeoContent {
  intro: string;
  context: { title: string; body: string };
  importance: { title: string; body: string };
  keyPoints: { title: string; bullets: string[] };
}

const SEO_CONTENT: Record<string, EnterpriseSeoContent> = {
  'somair': {
    intro:
      "La Société des Mines de l'Aïr (SOMAÏR) est l'une des entreprises les plus emblématiques du Niger, exploitant le gisement uranifère d'Arlit dans la région d'Agadez depuis 1971. Filiale du groupe Orano (anciennement Areva) et de l'État nigérien, elle a longtemps fait du Niger l'un des principaux producteurs mondiaux d'uranium, alimentant notamment les centrales nucléaires françaises.",
    context: {
      title: 'Le rôle stratégique de SOMAÏR au Niger',
      body:
        "L'uranium produit par SOMAÏR a représenté pendant des décennies la principale source de devises étrangères du Niger, finançant une part significative du budget national et structurant toute l'économie de la région d'Agadez. La société emploie directement plusieurs milliers de personnes et soutient indirectement un écosystème complet de sous-traitants, transporteurs et fournisseurs locaux.",
    },
    importance: {
      title: 'Enjeux actuels et perspectives',
      body:
        "Depuis le coup d'État de juillet 2023 et les tensions diplomatiques avec la France, l'avenir de SOMAÏR est devenu un enjeu géopolitique majeur. Les autorités nigériennes ont retiré le permis d'exploitation à Orano, ouvrant la voie à une potentielle nationalisation ou un nouveau partenariat avec d'autres puissances comme la Russie ou la Chine. La transition énergétique mondiale et la demande croissante d'uranium pour le nucléaire civil renforcent l'importance stratégique de ces gisements.",
    },
    keyPoints: {
      title: 'Points clés à retenir',
      bullets: [
        "Implantation à Arlit (région d'Agadez) depuis 1971, exploitation à ciel ouvert.",
        "Capital partagé entre Orano (filiale française) et l'État nigérien.",
        "Le Niger figure historiquement parmi les 5 premiers producteurs mondiaux d'uranium.",
        "Contribue significativement aux exportations et aux recettes fiscales du pays.",
        "Avenir incertain depuis 2023 avec le retrait du permis d'exploitation d'Orano.",
      ],
    },
  },
  'cominak': {
    intro:
      "La Compagnie Minière d'Akouta (COMINAK) a exploité jusqu'en 2021 le gisement d'uranium souterrain d'Akouta, près d'Arlit, dans la région d'Agadez. Filiale du groupe Orano et de partenaires japonais, espagnols et nigériens, elle a été pendant 47 ans l'une des principales mines d'uranium souterraines au monde avant la fin de son exploitation pour épuisement du gisement.",
    context: {
      title: 'L\'héritage de COMINAK pour le Niger',
      body:
        "COMINAK a marqué l'histoire industrielle nigérienne avec une production cumulée de plus de 75 000 tonnes d'uranium métal sur près d'un demi-siècle. La société employait à son apogée plus de 600 personnes directement et a structuré toute l'économie locale d'Akouta et d'Arlit. Sa fermeture en 2021 a posé d'énormes défis sociaux (reconversion des employés) et environnementaux (réhabilitation du site).",
    },
    importance: {
      title: 'Réhabilitation et défis post-fermeture',
      body:
        "Depuis l'arrêt de l'exploitation, COMINAK est entrée dans une phase de fermeture programmée incluant la mise en sécurité du site, le démantèlement des installations et la réhabilitation environnementale. Les enjeux portent sur la gestion des résidus radioactifs, la dépollution des sols et la reconversion économique de la région d'Arlit, fortement dépendante de l'industrie minière depuis cinquante ans.",
    },
    keyPoints: {
      title: 'Points clés à retenir',
      bullets: [
        "Exploitation souterraine d'uranium à Akouta, près d'Arlit, depuis 1974.",
        "Filiale Orano avec partenaires japonais (OURD), espagnol (Enusa) et nigérien.",
        "Fermée en mars 2021 après épuisement du gisement.",
        "Phase actuelle de réhabilitation environnementale et de gestion des résidus.",
        "Impact social majeur sur la commune d'Arlit avec la fin de l'emploi minier.",
      ],
    },
  },
  'sonibank': {
    intro:
      "La Société Nigérienne de Banque (SONIBANK) figure parmi les principales banques commerciales du Niger, avec un réseau d'agences couvrant Niamey et les principales villes du pays. Établissement de crédit agréé par la BCEAO, elle propose une gamme complète de services aux particuliers, aux entreprises et aux institutions, et joue un rôle clé dans le financement de l'économie nigérienne.",
    context: {
      title: 'SONIBANK dans le paysage bancaire nigérien',
      body:
        "Le secteur bancaire nigérien compte une dizaine d'établissements agréés, dont SONIBANK qui se distingue par son ancrage historique dans le pays et sa présence dans les principales régions. La banque opère sous la supervision de la BCEAO (Banque Centrale des États de l'Afrique de l'Ouest) et de la Commission Bancaire de l'UEMOA, garantissant un cadre prudentiel solide.",
    },
    importance: {
      title: 'Rôle dans l\'économie nigérienne',
      body:
        "SONIBANK contribue au financement des entreprises nigériennes (PME, grandes entreprises, secteur public) et propose des solutions d'épargne et de crédit aux particuliers. Dans un contexte d'inclusion financière croissante au Niger, où le taux de bancarisation reste sous 20% de la population adulte, les banques comme SONIBANK jouent un rôle central pour rapprocher les services financiers des populations.",
    },
    keyPoints: {
      title: 'Points clés à retenir',
      bullets: [
        "Banque commerciale agréée par la BCEAO, présente dans les grandes villes du Niger.",
        "Offre comptes courants, épargne, crédits aux particuliers et entreprises.",
        "Soumise au cadre prudentiel UEMOA et aux ratios de solvabilité Bâle.",
        "Acteur du financement de l'économie nigérienne (PME, grandes entreprises, État).",
        "Contribue à l'inclusion financière dans un pays au faible taux de bancarisation.",
      ],
    },
  },
  'sonidep': {
    intro:
      "La Société Nigérienne des Produits Pétroliers (SONIDEP) est l'entreprise publique nigérienne en charge de l'importation, du stockage, du transport et de la distribution des produits pétroliers raffinés au Niger. Elle joue un rôle stratégique dans la sécurité énergétique du pays, notamment depuis la mise en service du pipeline tchado-nigérien et de la raffinerie de Zinder.",
    context: {
      title: 'SONIDEP et la souveraineté énergétique',
      body:
        "Dans un pays enclavé comme le Niger, l'approvisionnement en carburants (essence, gasoil, kérosène) est un enjeu stratégique majeur. SONIDEP gère les dépôts pétroliers principaux (Niamey, Zinder, Maradi, Arlit) et coordonne la distribution vers les stations-service, les acteurs miniers et les administrations. Son monopole d'importation lui confère un rôle quasi-régalien sur la sécurité énergétique nationale.",
    },
    importance: {
      title: 'Le Niger producteur de pétrole',
      body:
        "Depuis la mise en service de la raffinerie de Soraz à Zinder en 2011 (coentreprise avec la China National Petroleum Corporation) et l'inauguration du pipeline d'export vers le Bénin en 2024, le Niger est devenu producteur et exportateur net de pétrole. SONIDEP coordonne l'approvisionnement intérieur tandis que les exports génèrent des revenus en devises stratégiques pour le budget de l'État. La diversification des sources et la maîtrise de la chaîne logistique restent des défis permanents.",
    },
    keyPoints: {
      title: 'Points clés à retenir',
      bullets: [
        "Société d'État chargée de l'importation, stockage et distribution des hydrocarbures.",
        "Gère les dépôts pétroliers de Niamey, Zinder, Maradi et Arlit.",
        "Travaille en lien avec la raffinerie de Soraz (Zinder) opérée par CNPC.",
        "Acteur stratégique de la sécurité énergétique du Niger.",
        "Le pipeline d'export pétrolier inauguré en 2024 transforme le secteur.",
      ],
    },
  },
  'nigelec': {
    intro:
      "La Société Nigérienne d'Électricité (NIGELEC) est l'entreprise publique en charge de la production, du transport et de la distribution de l'électricité au Niger. Acteur central du secteur énergétique nigérien depuis sa création en 1968, elle dessert les grandes villes via le réseau interconnecté et les zones rurales via des centrales thermiques décentralisées et l'électrification solaire.",
    context: {
      title: 'NIGELEC et le défi de l\'électrification',
      body:
        "Le Niger affiche l'un des taux d'accès à l'électricité parmi les plus bas d'Afrique de l'Ouest, autour de 20% au niveau national et nettement plus faible en zone rurale. NIGELEC importe historiquement une part significative de son électricité depuis le Nigeria voisin, ce qui crée une vulnérabilité face aux délestages dans le pays voisin. Plusieurs projets de centrales solaires et de centrale au charbon (Salkadamna) visent à renforcer la souveraineté énergétique.",
    },
    importance: {
      title: 'Transition énergétique et investissements',
      body:
        "Pour répondre à la demande croissante (urbanisation, industrialisation, agriculture irriguée), NIGELEC investit dans la modernisation du réseau, l'extension des capacités de production et le développement des énergies renouvelables. La diversification du mix énergétique (solaire, éolien, hydraulique, charbon, gaz) et la connexion à l'interconnexion électrique régionale UEMOA/CEDEAO sont des chantiers majeurs des prochaines années.",
    },
    keyPoints: {
      title: 'Points clés à retenir',
      bullets: [
        "Entreprise publique de production, transport et distribution d'électricité, créée en 1968.",
        "Dessert les grandes villes (Niamey, Maradi, Zinder, Tahoua, Agadez) et zones rurales.",
        "Importation historique d'électricité depuis le Nigeria voisin.",
        "Projets en cours : centrale solaire, centrale charbon de Salkadamna, interconnexion UEMOA.",
        "Enjeu majeur d'élargissement de l'accès à l'électricité (taux <25% en zone rurale).",
      ],
    },
  },
  'niger-telecoms': {
    intro:
      "Niger Telecoms est l'opérateur historique des télécommunications du Niger, issu de la fusion de la SONITEL (téléphonie fixe) et de SAHELCOM (mobile) en 2017. Entreprise publique, elle exploite le réseau de fibre optique national, les liaisons internationales et propose des services de téléphonie fixe, mobile, internet et data aux particuliers comme aux entreprises.",
    context: {
      title: 'Le marché des télécoms au Niger',
      body:
        "Le marché nigérien des télécommunications est concurrentiel avec quatre opérateurs principaux : Niger Telecoms, Airtel, Moov Africa (Maroc Telecom) et Zamani. Le taux de pénétration mobile dépasse 50% mais l'internet à haut débit reste limité par les infrastructures et le pouvoir d'achat. Niger Telecoms se distingue par son monopole sur la fibre optique nationale et son rôle dans les services régaliens (administration, ministères, ambassades).",
    },
    importance: {
      title: 'Numérisation et souveraineté digitale',
      body:
        "La transformation digitale du Niger passe par l'extension de la fibre optique, le déploiement de la 4G et la préparation à la 5G, et le développement de services numériques (e-administration, paiements numériques, télémédecine). Niger Telecoms est positionnée comme un acteur clé pour soutenir la souveraineté numérique du pays, notamment via le data center national et les services cloud souverains.",
    },
    keyPoints: {
      title: 'Points clés à retenir',
      bullets: [
        "Opérateur public issu de la fusion SONITEL et SAHELCOM en 2017.",
        "Exploite le réseau de fibre optique national et les liaisons internationales.",
        "Propose téléphonie fixe, mobile, internet, data et services entreprises.",
        "Concurrence : Airtel, Moov Africa (Maroc Telecom), Zamani.",
        "Acteur clé de la souveraineté numérique et de l'administration électronique.",
      ],
    },
  },
  'bagri': {
    intro:
      "La Banque Agricole du Niger (BAGRI) est une banque spécialisée dans le financement du secteur agricole et rural, secteur clé de l'économie nigérienne représentant environ 40% du PIB et employant la majorité de la population active. Créée pour combler le déficit de financement de l'agriculture, elle propose des crédits adaptés aux producteurs, aux coopératives et aux entreprises agro-industrielles.",
    context: {
      title: 'Le défi du financement agricole au Niger',
      body:
        "L'agriculture nigérienne reste largement traditionnelle, dominée par les cultures vivrières (mil, sorgho, niébé, arachide), l'élevage et le maraîchage. Le secteur souffre historiquement d'un sous-financement structurel : les banques classiques considèrent le risque agricole trop élevé (aléas climatiques, faible rentabilité unitaire, absence de garanties). BAGRI a été créée pour combler ce vide et proposer des produits adaptés aux cycles agricoles.",
    },
    importance: {
      title: 'Mission et impact',
      body:
        "BAGRI finance les campagnes agricoles, l'achat d'intrants (semences, engrais, équipements), les projets d'irrigation, la transformation agroalimentaire et l'export. Elle joue aussi un rôle d'inclusion financière en bancarisant des populations rurales souvent exclues du système bancaire classique. Sa mission est essentielle pour la sécurité alimentaire et la souveraineté agricole du Niger.",
    },
    keyPoints: {
      title: 'Points clés à retenir',
      bullets: [
        "Banque spécialisée dans le financement agricole et rural au Niger.",
        "Cible les producteurs, coopératives, entreprises agro-industrielles, micro-entrepreneurs.",
        "Produits adaptés aux cycles agricoles : crédit campagne, équipement, intrants.",
        "Contribue à l'inclusion financière des populations rurales.",
        "Acteur clé de la sécurité alimentaire et de la souveraineté agricole nationale.",
      ],
    },
  },
  'sopamin': {
    intro:
      "La Société du Patrimoine des Mines du Niger (SOPAMIN) est l'entreprise publique nigérienne qui gère les participations de l'État dans le secteur minier. Elle représente l'État dans les sociétés minières en partenariat avec des opérateurs privés étrangers, principalement dans l'uranium (SOMAÏR, COMINAK historiquement), l'or, le charbon et les minerais industriels.",
    context: {
      title: 'SOPAMIN, gardien des intérêts miniers de l\'État',
      body:
        "Le sous-sol nigérien recèle d'importantes ressources : uranium (Arlit, Akouta, Imouraren), or (Liptako-Gourma), charbon (Salkadamna), pétrole (Agadem) et minerais divers. SOPAMIN détient et gère les participations étatiques dans les sociétés d'exploitation, percevant dividendes et royalties qui alimentent le budget national. Elle joue aussi un rôle dans la négociation des conventions minières et la défense des intérêts publics.",
    },
    importance: {
      title: 'Souveraineté minière et nouveaux partenariats',
      body:
        "Avec l'évolution géopolitique récente (coup d'État de 2023, tensions avec la France, rapprochement avec la Russie et la Chine), SOPAMIN est au cœur des négociations sur l'avenir des concessions minières et la révision des partenariats. Le projet d'Imouraren (gisement uranifère majeur jamais exploité), l'or, le pétrole et les minerais critiques pour la transition énergétique (lithium, cobalt) représentent des enjeux stratégiques pour la prochaine décennie.",
    },
    keyPoints: {
      title: 'Points clés à retenir',
      bullets: [
        "Société publique gérant les participations de l'État dans le secteur minier.",
        "Participations dans uranium, or, charbon, pétrole et autres minerais.",
        "Perçoit dividendes et royalties pour le budget national.",
        "Rôle clé dans la négociation des conventions minières.",
        "Acteur central de la souveraineté minière et des nouveaux partenariats.",
      ],
    },
  },
};

interface EnterpriseInfo {
  slug: string;
  name: string;
  sector?: string | null;
}

export function EnterpriseSeoBlock({ enterprise }: { enterprise: EnterpriseInfo }) {
  const content = SEO_CONTENT[enterprise.slug];
  if (!content) return null;

  return (
    <section className="border-t border-black/6 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <div className="prose prose-sm sm:prose-base max-w-none">
          <p className="text-[15px] sm:text-[16px] leading-relaxed text-gray-700 text-pretty mb-10 text-justify hyphens-auto">
            {content.intro}
          </p>

          <h2 className="text-xl sm:text-2xl font-bold text-[#111] mt-10 mb-3">
            {content.context.title}
          </h2>
          <p className="text-[15px] leading-relaxed text-gray-700 text-pretty mb-10 text-justify hyphens-auto">
            {content.context.body}
          </p>

          <h2 className="text-xl sm:text-2xl font-bold text-[#111] mt-10 mb-3">
            {content.importance.title}
          </h2>
          <p className="text-[15px] leading-relaxed text-gray-700 text-pretty mb-10 text-justify hyphens-auto">
            {content.importance.body}
          </p>

          <h2 className="text-xl sm:text-2xl font-bold text-[#111] mt-10 mb-4">
            {content.keyPoints.title}
          </h2>
          <ul className="space-y-2.5 text-[15px] text-gray-700">
            {content.keyPoints.bullets.map((b) => (
              <li key={b} className="flex items-start gap-3">
                <span className="mt-2 shrink-0 w-1.5 h-1.5 rounded-full bg-gold" />
                <span className="leading-relaxed">{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

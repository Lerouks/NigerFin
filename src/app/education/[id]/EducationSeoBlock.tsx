interface EducationSeoContent {
  intro: string;
  whoFor: { title: string; bullets: string[] };
  whyImportant: { title: string; body: string };
  whatYouLearn: { title: string; bullets: string[] };
}

const SEO_CONTENT: Record<string, EducationSeoContent> = {
  'budget-banque': {
    intro:
      "Maîtriser son budget personnel et comprendre les services bancaires reste l'une des compétences financières les plus utiles au quotidien, en particulier dans un contexte ouest-africain où l'inclusion financière progresse rapidement. Cette catégorie regroupe des leçons pratiques pour gérer ses revenus, ses dépenses, son épargne et utiliser efficacement les outils bancaires disponibles au Niger.",
    whoFor: {
      title: 'Pour qui est cette formation',
      bullets: [
        "Salariés du public ou du privé qui veulent reprendre le contrôle de leurs finances mensuelles.",
        "Étudiants et jeunes actifs qui ouvrent leur premier compte bancaire à Niamey ou ailleurs.",
        "Entrepreneurs et indépendants qui doivent séparer comptes personnels et comptes professionnels.",
        "Toute personne qui veut comprendre les frais bancaires et choisir la banque la mieux adaptée.",
      ],
    },
    whyImportant: {
      title: 'Pourquoi maîtriser son budget et sa banque',
      body:
        "Au Niger, le taux d'épargne reste faible et beaucoup de ménages vivent au mois le mois. Comprendre les mécanismes bancaires de base (compte courant, livret, virement, prélèvement, frais d'agios) et structurer un budget familial avec la méthode 50/30/20 permet de dégager de l'épargne, d'éviter le découvert et de constituer un matelas de sécurité face aux imprévus médicaux ou professionnels.",
    },
    whatYouLearn: {
      title: 'Ce que vous apprendrez',
      bullets: [
        "Construire un budget mensuel réaliste et le tenir dans la durée.",
        "Comparer les offres des banques au Niger (BOA, Ecobank, SONIBANK, BAGRI, Atlantique).",
        "Comprendre les frais bancaires (commission de tenue de compte, agios, frais de virement).",
        "Utiliser le Mobile Money (Airtel, Moov, MyNita) en complément du compte bancaire.",
        "Mettre en place une épargne automatique dès la réception du salaire.",
      ],
    },
  },
  'devises-change': {
    intro:
      "Comprendre les mécanismes des devises et du change est essentiel pour quiconque commerce, investit ou voyage en dehors de la zone FCFA. Le franc CFA d'Afrique de l'Ouest (XOF) est arrimé à l'euro à parité fixe (655,957 FCFA pour 1 euro), mais les conversions vers le dollar américain, le yuan chinois, le naira nigérian ou la livre sterling fluctuent quotidiennement et peuvent peser lourd sur les budgets.",
    whoFor: {
      title: 'Pour qui est cette formation',
      bullets: [
        "Importateurs et commerçants qui négocient en USD, EUR, CNY ou NGN.",
        "Entrepreneurs en marketplace internationale (Alibaba, Amazon, etc.).",
        "Étudiants et expatriés nigériens vivant ou voyageant à l'étranger.",
        "Investisseurs particuliers qui s'intéressent aux marchés financiers internationaux.",
      ],
    },
    whyImportant: {
      title: 'Pourquoi le change compte au Niger',
      body:
        "Une grande partie de l'économie nigérienne dépend des importations payées en devises étrangères, et l'évolution du dollar face au FCFA peut bouleverser le coût de la vie. Comprendre les facteurs qui font bouger les devises (taux directeurs des banques centrales, balances commerciales, tensions géopolitiques) permet d'anticiper l'évolution des prix à l'importation et de prendre des décisions éclairées sur le moment opportun pour acheter ou convertir.",
    },
    whatYouLearn: {
      title: 'Ce que vous apprendrez',
      bullets: [
        "Lire et interpréter un cours de change (paire EUR/USD, USD/XOF, NGN/XOF).",
        "Comprendre la différence entre marché interbancaire, bureau de change et Mobile Money.",
        "Utiliser des plateformes de transfert rapide pour optimiser ses conversions.",
        "Anticiper l'impact des décisions de la BCEAO et de la Réserve fédérale américaine.",
        "Se couvrir contre le risque de change pour les transactions à terme.",
      ],
    },
  },
  'crypto-blockchain': {
    intro:
      "Les cryptomonnaies et la technologie blockchain transforment progressivement la finance mondiale, et l'Afrique de l'Ouest figure parmi les régions les plus dynamiques en termes d'adoption. Cette catégorie démystifie les concepts clés (Bitcoin, Ethereum, stablecoins, smart contracts, DeFi) et donne les outils pour évaluer les opportunités et les risques dans le contexte nigérien et UEMOA.",
    whoFor: {
      title: 'Pour qui est cette formation',
      bullets: [
        "Curieux qui veulent comprendre la technologie blockchain sans pré-requis technique.",
        "Investisseurs débutants qui envisagent une exposition mesurée aux cryptomonnaies.",
        "Entrepreneurs qui explorent les paiements décentralisés et la tokenisation.",
        "Travailleurs de la diaspora qui utilisent les stablecoins pour les transferts d'argent.",
      ],
    },
    whyImportant: {
      title: 'Pourquoi l\'Afrique de l\'Ouest s\'intéresse aux crypto',
      body:
        "Plusieurs pays voisins (Nigeria, Ghana, Kenya, Afrique du Sud) figurent dans le top mondial de l'adoption crypto en pourcentage de la population. Les stablecoins comme l'USDT et l'USDC servent de plus en plus aux transferts internationaux à faible coût, contournant les frais bancaires élevés. Pour autant, les risques (volatilité, arnaques, cadre réglementaire encore flou) imposent une approche prudente et informée.",
    },
    whatYouLearn: {
      title: 'Ce que vous apprendrez',
      bullets: [
        "Distinguer Bitcoin, Ethereum, stablecoins, NFT et tokens utilitaires.",
        "Comprendre comment fonctionne une blockchain et pourquoi elle est sécurisée.",
        "Choisir un wallet (Trust Wallet, MetaMask, Ledger) et sécuriser ses clés privées.",
        "Évaluer un projet crypto avant d'investir (whitepaper, équipe, tokenomics).",
        "Comprendre les risques fiscaux et réglementaires au Niger et en UEMOA.",
      ],
    },
  },
  'immobilier': {
    intro:
      "L'immobilier reste l'un des placements préférés des familles nigériennes, à la fois comme valeur refuge et comme source de revenus locatifs. Ce parcours détaille toutes les étapes pour acheter, vendre ou louer un bien à Niamey, Maradi, Zinder ou ailleurs, en couvrant le cadre juridique OHADA, la fiscalité nigérienne et les pratiques de marché.",
    whoFor: {
      title: 'Pour qui est cette formation',
      bullets: [
        "Primo-accédants qui préparent leur premier achat immobilier au Niger.",
        "Investisseurs qui veulent constituer un patrimoine locatif.",
        "Diaspora nigérienne qui investit dans l'immobilier au pays.",
        "Propriétaires bailleurs qui veulent optimiser la gestion de leurs biens.",
      ],
    },
    whyImportant: {
      title: 'Pourquoi l\'immobilier est stratégique au Niger',
      body:
        "Avec une population qui croît rapidement, une urbanisation accélérée et une jeunesse qui rentre progressivement dans la vie active, la demande de logements à Niamey reste structurellement supérieure à l'offre. L'immobilier offre une protection contre l'inflation, des revenus locatifs récurrents et une transmission patrimoniale facilitée par le droit OHADA, sous réserve de bien sécuriser le titre foncier et la conformité administrative.",
    },
    whatYouLearn: {
      title: 'Ce que vous apprendrez',
      bullets: [
        "Comprendre le titre foncier nigérien et vérifier l'authenticité d'un titre.",
        "Calculer la rentabilité locative brute et nette d'un bien à Niamey.",
        "Négocier un crédit immobilier avec une banque locale.",
        "Maîtriser les démarches administratives (mutation, immatriculation, hypothèque).",
        "Gérer un bien locatif (bail, état des lieux, fiscalité, charges).",
      ],
    },
  },
  'entrepreneuriat': {
    intro:
      "Créer et développer une entreprise au Niger demande à la fois une vision claire, une compréhension fine de l'écosystème local et une rigueur financière. Ce parcours couvre toutes les étapes critiques, du choix de la forme juridique (entreprise individuelle, SARL, SAS OHADA) à la levée de fonds, en passant par la fiscalité et la gestion d'équipe.",
    whoFor: {
      title: 'Pour qui est cette formation',
      bullets: [
        "Porteurs de projet qui veulent structurer leur idée en entreprise viable.",
        "Entrepreneurs déjà lancés qui veulent professionnaliser leur gestion.",
        "Salariés qui préparent leur transition vers l'entrepreneuriat.",
        "Étudiants qui s'intéressent à la création d'entreprise au Niger.",
      ],
    },
    whyImportant: {
      title: 'L\'entrepreneuriat, moteur de l\'économie nigérienne',
      body:
        "Le Niger compte une majorité d'entreprises informelles et un tissu d'auto-entrepreneurs et de PME en pleine structuration. Les politiques d'inclusion économique de la CEDEAO et de l'UEMOA encouragent la formalisation, l'accès au crédit et l'export régional. Bien lancer son entreprise demande de connaître les démarches RCCM, le code des impôts nigérien, les obligations CNSS et les opportunités de financement locales (BAGRI, BIA, microfinance).",
    },
    whatYouLearn: {
      title: 'Ce que vous apprendrez',
      bullets: [
        "Choisir la forme juridique adaptée (entreprise individuelle, SARL, SAS OHADA).",
        "Réaliser un business plan crédible pour les banques et investisseurs.",
        "Comprendre la fiscalité nigérienne (TVA, impôt BIC, ISB, CFE).",
        "Lancer un MVP (Minimum Viable Product) avec un budget contraint.",
        "Recruter, manager et fidéliser ses premiers collaborateurs.",
      ],
    },
  },
  'fiscalite-droit': {
    intro:
      "Comprendre la fiscalité et le cadre juridique nigérien est indispensable pour ne pas se faire surprendre par un redressement, optimiser légalement ses revenus et structurer un patrimoine pérenne. Cette catégorie couvre les principaux impôts, taxes et cotisations qui s'appliquent aux particuliers comme aux entreprises au Niger.",
    whoFor: {
      title: 'Pour qui est cette formation',
      bullets: [
        "Salariés qui veulent comprendre leur fiche de paie et leur ITS.",
        "Entrepreneurs qui doivent gérer la TVA, l'IS et les retenues à la source.",
        "Propriétaires et investisseurs concernés par la taxe foncière et les plus-values.",
        "Toute personne qui veut connaître ses droits face à l'administration fiscale.",
      ],
    },
    whyImportant: {
      title: 'Pourquoi la fiscalité compte au Niger',
      body:
        "Le code général des impôts nigérien évolue régulièrement, et les lois de finances annuelles ajustent les taux, les seuils et les obligations déclaratives. Une bonne maîtrise de la fiscalité permet de se conformer aux obligations légales, d'optimiser la trésorerie et de bénéficier des dispositifs incitatifs (zones franches, exonérations sectorielles, codes minier et pétrolier).",
    },
    whatYouLearn: {
      title: 'Ce que vous apprendrez',
      bullets: [
        "Comprendre les impôts directs (ITS, IS, BIC, BNC) et indirects (TVA, droits d'enregistrement).",
        "Calculer ses obligations fiscales et préparer ses déclarations dans les délais.",
        "Connaître les régimes fiscaux particuliers (zones franches, code minier).",
        "Maîtriser la fiscalité immobilière (taxe foncière, plus-values, droits de mutation).",
        "Réagir face à un contrôle fiscal et ses droits comme contribuable.",
      ],
    },
  },
  'assurance-prevoyance': {
    intro:
      "Anticiper les coups durs de la vie (maladie, accident, décès, incendie, vol) avec des contrats d'assurance et des solutions de prévoyance reste l'un des piliers d'une gestion financière saine. Cette catégorie présente les produits d'assurance disponibles au Niger et explique comment construire une protection adaptée à votre situation familiale et professionnelle.",
    whoFor: {
      title: 'Pour qui est cette formation',
      bullets: [
        "Chefs de famille qui veulent protéger leurs proches financièrement.",
        "Propriétaires de véhicules ou de biens immobiliers à assurer.",
        "Entrepreneurs qui doivent couvrir leurs risques professionnels.",
        "Salariés qui complètent leur couverture CNSS avec une assurance privée.",
      ],
    },
    whyImportant: {
      title: 'Pourquoi s\'assurer au Niger',
      body:
        "Le marché de l'assurance reste sous-développé au Niger, avec un taux de pénétration parmi les plus faibles d'Afrique de l'Ouest. Les compagnies présentes (NSIA, SAHAM, SUNU, Allianz Africa) proposent des produits couvrant l'auto, l'habitation, la santé, la vie et les risques professionnels. Une bonne couverture évite que des événements imprévisibles ne ruinent des années d'efforts financiers.",
    },
    whatYouLearn: {
      title: 'Ce que vous apprendrez',
      bullets: [
        "Comprendre les bases d'un contrat d'assurance (prime, franchise, exclusions).",
        "Choisir une assurance auto adaptée (responsabilité civile, tous risques).",
        "Comparer les offres d'assurance vie et d'assurance prévoyance décès.",
        "Compléter la CNSS avec une mutuelle santé ou une assurance privée.",
        "Faire valoir ses droits en cas de sinistre et négocier l'indemnisation.",
      ],
    },
  },
  'bases-finance': {
    intro:
      "Cette formation pose les fondations de toute culture financière solide : comprendre comment fonctionnent les revenus, l'épargne, l'investissement, le crédit, l'inflation et le temps en finance. C'est le point de départ idéal pour quiconque veut prendre le contrôle de ses finances personnelles et naviguer sereinement dans le monde économique.",
    whoFor: {
      title: 'Pour qui est cette formation',
      bullets: [
        "Étudiants et jeunes actifs qui démarrent leur vie financière.",
        "Personnes qui ont l'impression que la finance est inaccessible ou compliquée.",
        "Parents qui veulent transmettre une bonne éducation financière à leurs enfants.",
        "Toute personne qui veut comprendre les notions de base avant d'aller plus loin.",
      ],
    },
    whyImportant: {
      title: 'Pourquoi commencer par les bases',
      body:
        "Trop d'erreurs financières découlent d'une mauvaise compréhension des concepts fondamentaux : confondre épargne et investissement, sous-estimer l'inflation, surévaluer le risque ou ignorer la puissance des intérêts composés. Maîtriser les bases permet ensuite d'aborder les sujets plus avancés (bourse, immobilier, fiscalité) avec confiance et discernement.",
    },
    whatYouLearn: {
      title: 'Ce que vous apprendrez',
      bullets: [
        "Distinguer revenus, dépenses, épargne et investissement.",
        "Comprendre l'inflation et son impact réel sur votre pouvoir d'achat.",
        "Maîtriser la valeur temps de l'argent et les intérêts composés.",
        "Différencier les notions de risque, de rendement et de liquidité.",
        "Construire une stratégie financière personnelle équilibrée et durable.",
      ],
    },
  },
  'bourse-investissement': {
    intro:
      "Investir en bourse et sur les marchés financiers permet de faire fructifier son capital sur le long terme, à condition d'en comprendre les mécanismes et les risques. Cette catégorie couvre les marchés africains (BRVM, NSE, JSE) et internationaux (Wall Street, Euronext), avec un focus particulier sur la BRVM (Bourse Régionale des Valeurs Mobilières) accessible depuis le Niger.",
    whoFor: {
      title: 'Pour qui est cette formation',
      bullets: [
        "Épargnants qui cherchent un rendement supérieur aux livrets bancaires.",
        "Investisseurs débutants qui veulent commencer la BRVM ou les marchés mondiaux.",
        "Personnes qui s'intéressent aux dividendes et au revenu passif.",
        "Curieux qui veulent comprendre la finance de marché en profondeur.",
      ],
    },
    whyImportant: {
      title: 'Pourquoi investir depuis le Niger',
      body:
        "La BRVM, basée à Abidjan, regroupe les sociétés cotées des 8 pays UEMOA et reste accessible aux Nigériens via les SGI (Sociétés de Gestion et d'Intermédiation) agréées. Sur le long terme, les marchés actions historiquement délivrent des rendements supérieurs à l'inflation, à condition d'accepter la volatilité court terme et de diversifier intelligemment. Investir tôt et régulièrement reste la stratégie la plus efficace pour la majorité des investisseurs particuliers.",
    },
    whatYouLearn: {
      title: 'Ce que vous apprendrez',
      bullets: [
        "Ouvrir un compte titres via une SGI BRVM agréée.",
        "Lire et analyser un rapport annuel d'entreprise cotée.",
        "Distinguer analyse fondamentale et analyse technique.",
        "Construire un portefeuille diversifié adapté à votre profil de risque.",
        "Maîtriser sa psychologie d'investisseur face à la volatilité du marché.",
      ],
    },
  },
  'economie-niger': {
    intro:
      "Comprendre l'économie nigérienne est essentiel pour quiconque vit, investit ou travaille au Niger. Cette catégorie offre une vision panoramique des fondamentaux macroéconomiques (PIB, inflation, dette, balance commerciale), des secteurs stratégiques (agriculture, mines, énergie) et de l'intégration régionale du Niger au sein de l'UEMOA et de la CEDEAO.",
    whoFor: {
      title: 'Pour qui est cette formation',
      bullets: [
        "Étudiants et chercheurs en économie qui étudient le Niger ou l'Afrique de l'Ouest.",
        "Investisseurs internationaux qui s'intéressent au marché nigérien.",
        "Cadres et décideurs locaux qui pilotent leur stratégie d'entreprise.",
        "Citoyens engagés qui veulent comprendre les enjeux économiques du pays.",
      ],
    },
    whyImportant: {
      title: 'Pourquoi l\'économie du Niger est unique',
      body:
        "Le Niger combine plusieurs caractéristiques économiques particulières : un secteur informel dominant, une dépendance forte aux matières premières (uranium, pétrole, or), une démographie jeune et croissante, et une intégration profonde dans l'UEMOA grâce au FCFA. Les défis (sécurité régionale, accès au financement, diversification) côtoient des opportunités majeures dans l'agro-industrie, les mines, l'énergie et les services financiers numériques.",
    },
    whatYouLearn: {
      title: 'Ce que vous apprendrez',
      bullets: [
        "Lire les indicateurs macroéconomiques clés du Niger (BCEAO, INS, FMI).",
        "Comprendre la balance commerciale, les exportations et la dépendance aux matières premières.",
        "Analyser les politiques de la BCEAO et leur impact sur l'économie nigérienne.",
        "Identifier les secteurs porteurs et les opportunités d'investissement.",
        "Comprendre l'intégration régionale UEMOA et CEDEAO dans la pratique.",
      ],
    },
  },
};

export function EducationSeoBlock({ slug }: { slug: string }) {
  const content = SEO_CONTENT[slug];
  if (!content) return null;

  return (
    <section className="border-t border-black/[0.06] bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <div className="prose prose-sm sm:prose-base max-w-none">
          <p className="text-[15px] sm:text-[16px] leading-relaxed text-gray-700 mb-10">
            {content.intro}
          </p>

          <h2 className="text-xl sm:text-2xl font-bold text-[#111] mt-10 mb-4">
            {content.whoFor.title}
          </h2>
          <ul className="space-y-2.5 text-[15px] text-gray-700 mb-10">
            {content.whoFor.bullets.map((b) => (
              <li key={b} className="flex items-start gap-3">
                <span className="mt-2 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-gold" />
                <span className="leading-relaxed">{b}</span>
              </li>
            ))}
          </ul>

          <h2 className="text-xl sm:text-2xl font-bold text-[#111] mt-10 mb-3">
            {content.whyImportant.title}
          </h2>
          <p className="text-[15px] leading-relaxed text-gray-700 mb-10">
            {content.whyImportant.body}
          </p>

          <h2 className="text-xl sm:text-2xl font-bold text-[#111] mt-10 mb-4">
            {content.whatYouLearn.title}
          </h2>
          <ul className="space-y-2.5 text-[15px] text-gray-700">
            {content.whatYouLearn.bullets.map((b) => (
              <li key={b} className="flex items-start gap-3">
                <span className="mt-2 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-gold" />
                <span className="leading-relaxed">{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

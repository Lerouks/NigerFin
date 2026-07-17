interface ToolSeoBlock {
  intro: string;
  howItWorks: { title: string; body: string };
  context: { title: string; body: string };
  tips: { title: string; bullets: string[] };
}

const SEO_CONTENT: Record<string, ToolSeoBlock> = {
  'simulateur-emprunt': {
    intro:
      "Que vous prépariez l'achat d'un véhicule, le financement d'un projet immobilier à Niamey ou un crédit à la consommation auprès d'une banque locale (SONIBANK, BOA Niger, Ecobank Niger, BAGRI, Banque Atlantique), simuler votre emprunt avant de signer est essentiel. Ce simulateur calcule vos mensualités, le coût total du crédit et la part des intérêts en quelques secondes, à partir des trois variables clés : le montant emprunté, la durée et le taux d'intérêt.",
    howItWorks: {
      title: 'Comment fonctionne le simulateur',
      body:
        "L'outil applique la formule classique du crédit amortissable à mensualités constantes. La mensualité est calculée à partir du capital emprunté, du taux mensuel (taux annuel divisé par 12) et du nombre total de mensualités. Vous obtenez immédiatement le détail de chaque versement et la décomposition entre capital remboursé et intérêts payés sur toute la durée du prêt.",
    },
    context: {
      title: 'Contexte du crédit au Niger',
      body:
        "Au Niger comme dans l'ensemble de la zone UEMOA, le taux d'usure fixé par la BCEAO encadre les conditions de crédit (15 % pour les particuliers, 19 % pour les microcrédits hors structures spécialisées). Les taux pratiqués par les banques varient selon le profil de l'emprunteur, la nature du financement et les garanties apportées. Comparer plusieurs offres reste indispensable avant de s'engager.",
    },
    tips: {
      title: 'Conseils pour bien emprunter',
      bullets: [
        "Vérifier que la mensualité reste sous 33 % de vos revenus nets pour préserver votre reste à vivre.",
        "Comparer le TAEG (Taux Annuel Effectif Global) plutôt que le seul taux nominal, car il intègre frais de dossier, assurance et garanties.",
        "Privilégier une durée plus courte si vos revenus le permettent : la durée double souvent les intérêts payés.",
        "Anticiper la possibilité d'un remboursement anticipé en lisant attentivement les pénalités du contrat.",
        "Conserver une épargne de précaution équivalente à au moins 3 mois de mensualités avant de souscrire.",
      ],
    },
  },
  'interet-simple': {
    intro:
      "L'intérêt simple est le mécanisme financier le plus basique et le plus utilisé pour les placements de courte durée, les bons du Trésor BCEAO, les comptes sur livret bancaires et certains crédits à très court terme. Contrairement à l'intérêt composé, les intérêts générés ne se réinvestissent pas dans le capital, ce qui rend le calcul prévisible et linéaire dans le temps.",
    howItWorks: {
      title: 'La formule de calcul',
      body:
        "L'intérêt simple se calcule en multipliant le capital initial par le taux d'intérêt annuel et par la durée exprimée en années (Intérêt = Capital × Taux × Durée). Pour une durée en mois, la durée est divisée par 12. À la fin de la période, vous récupérez votre capital initial plus les intérêts cumulés.",
    },
    context: {
      title: 'Quand utiliser l\'intérêt simple',
      body:
        "L'intérêt simple est utilisé pour les bons du Trésor de l'UEMOA, les dépôts à terme bancaires, certains comptes d'épargne classiques au Niger et la plupart des produits financiers à moins de 12 mois. Au-delà d'un an, la majorité des placements basculent en intérêt composé, où les intérêts produisent à leur tour des intérêts.",
    },
    tips: {
      title: 'Bien choisir son placement à intérêt simple',
      bullets: [
        "Vérifier la sécurité du produit : un bon du Trésor BCEAO offre une garantie souveraine, un compte bancaire dépend de la solidité de la banque.",
        "Comparer le taux net après prélèvements sociaux et fiscaux applicables au Niger.",
        "Privilégier les durées courtes (3 à 12 mois) si vous anticipez un besoin de liquidité.",
        "Réinvestir manuellement les intérêts sur un nouveau placement pour reproduire un effet composé.",
      ],
    },
  },
  'interet-compose': {
    intro:
      "L'intérêt composé est l'un des mécanismes les plus puissants en finance personnelle : les intérêts générés s'ajoutent au capital et produisent à leur tour des intérêts, créant un effet de levier exponentiel sur le long terme. C'est ce qu'Albert Einstein qualifiait de huitième merveille du monde. Cet outil simule la croissance de votre capital sur la durée de votre choix.",
    howItWorks: {
      title: 'La formule de l\'intérêt composé',
      body:
        "Le capital final se calcule comme Capital × (1 + Taux)^Durée. À chaque période, les intérêts s'ajoutent au capital de la période suivante. Plus la durée est longue, plus l'écart avec un placement à intérêt simple devient spectaculaire : sur 30 ans à 8 %, votre capital est multiplié par 10, contre 3,4 en intérêt simple.",
    },
    context: {
      title: 'Où trouver l\'intérêt composé au Niger et en UEMOA',
      body:
        "L'intérêt composé est à l'œuvre dans la plupart des placements à long terme : assurance-vie en unités de compte, plans d'épargne actions, OPCVM, dividendes réinvestis sur la BRVM, immobilier locatif (loyers réinvestis) et certaines obligations à coupons réinvestis. Pour bénéficier pleinement de cet effet, le facteur clé est la durée : commencer tôt vaut bien plus que placer beaucoup tard.",
    },
    tips: {
      title: 'Maximiser l\'effet de l\'intérêt composé',
      bullets: [
        "Commencer le plus tôt possible : 30 ans à 50 000 FCFA/mois à 8 % donnent plus que 60 ans à 200 000 FCFA/mois.",
        "Ne pas retirer les intérêts : chaque retrait casse l'effet de capitalisation.",
        "Augmenter régulièrement le montant placé en parallèle de l'évolution de vos revenus.",
        "Diversifier les supports pour limiter le risque sans sacrifier le rendement composé.",
        "Garder en tête l'inflation : un rendement nominal de 8 % donne 4-5 % réel après inflation UEMOA.",
      ],
    },
  },
  'simulateur-salaire': {
    intro:
      "Comprendre la décomposition de son salaire au Niger est essentiel avant toute négociation salariale, signature de contrat ou changement d'employeur. Cet outil estime votre salaire net mensuel à partir du brut, en intégrant les cotisations CNSS, l'impôt sur les traitements et salaires (ITS) et les autres prélèvements sociaux applicables selon la réglementation nigérienne en vigueur.",
    howItWorks: {
      title: 'Calcul du salaire net au Niger',
      body:
        "Le salaire net se calcule en trois étapes principales. D'abord, on déduit les cotisations CNSS (Caisse Nationale de Sécurité Sociale) à hauteur de 5,25 % pour le salarié et 15,40 % pour l'employeur. Ensuite, on applique l'impôt sur les traitements et salaires (ITS) selon le barème progressif nigérien, qui prend en compte la situation familiale et le nombre de parts. Le résultat constitue le salaire net versé chaque mois au salarié.",
    },
    context: {
      title: 'Le marché du travail nigérien',
      body:
        "Au Niger, le SMIG (Salaire Minimum Interprofessionnel Garanti) est fixé à 30 047 FCFA mensuels. Les rémunérations varient fortement selon les secteurs : la fonction publique offre des grilles indiciaires structurées, le secteur bancaire et minier des salaires plus élevés, et le secteur informel reste dominant. Le code du travail nigérien encadre les contrats, les congés payés et les indemnités de licenciement.",
    },
    tips: {
      title: 'Bien lire sa fiche de paie',
      bullets: [
        "Vérifier que les cotisations CNSS apparaissent bien à 5,25 % du salaire brut sur la fiche de paie.",
        "Demander le détail du calcul de l'ITS si le montant retenu vous semble incohérent.",
        "Comparer le salaire net affiché à votre virement bancaire effectif chaque mois.",
        "Prendre en compte les avantages en nature (logement, transport, téléphone) dans la négociation salariale globale.",
        "Conserver toutes vos fiches de paie : elles sont indispensables pour le calcul de la retraite CNSS.",
      ],
    },
  },
  'indices-economiques': {
    intro:
      "Suivre les indicateurs économiques clés du Niger et de la zone UEMOA est essentiel pour comprendre la conjoncture, anticiper les évolutions de prix, prendre des décisions d'investissement éclairées et ajuster sa stratégie financière personnelle ou professionnelle. Cet outil regroupe les principaux indices publiés par la BCEAO, l'INS Niger et les institutions internationales.",
    howItWorks: {
      title: 'Les indicateurs disponibles',
      body:
        "Le tableau de bord présente la croissance du PIB (Produit Intérieur Brut), l'inflation mesurée par l'IHPC (Indice Harmonisé des Prix à la Consommation), le taux directeur de la BCEAO, la dette publique en pourcentage du PIB, les réserves de change de l'UEMOA et les principaux taux de change FCFA face à l'euro, au dollar et au yuan. Chaque chiffre est mis à jour selon les publications officielles.",
    },
    context: {
      title: 'Comprendre l\'économie nigérienne',
      body:
        "L'économie du Niger repose sur l'agriculture (40 % du PIB), l'élevage, l'uranium (2e producteur mondial historique avec SOMAÏR et COMINAK), le pétrole exporté via le pipeline Niger-Bénin et un secteur informel important. Le pays bénéficie de l'ancrage du FCFA à l'euro (parité fixe à 655,957 FCFA/EUR) et de la stabilité monétaire qui en découle, gérée par la BCEAO.",
    },
    tips: {
      title: 'Utiliser les indicateurs pour décider',
      bullets: [
        "Surveiller l'inflation IHPC pour ajuster votre épargne : un placement à 4 % net avec 5 % d'inflation est en perte réelle.",
        "Suivre le taux directeur BCEAO pour anticiper les évolutions des taux de crédit bancaire.",
        "Comparer la croissance du PIB à celle des pays voisins (Mali, Burkina Faso, Sénégal) pour situer la performance économique.",
        "Consulter les réserves de change UEMOA, indicateur de la solidité du FCFA.",
        "Observer le taux d'endettement du Niger par rapport au critère de convergence UEMOA (70 % du PIB).",
      ],
    },
  },
  'budget-familial': {
    intro:
      "Construire un budget familial structuré est la première étape d'une gestion financière saine, en particulier dans un contexte où le coût de la vie à Niamey et dans les autres villes nigériennes évolue. Cet outil vous aide à analyser vos revenus, catégoriser vos dépenses, calculer votre taux d'épargne et identifier les postes où réaliser des économies sans sacrifier votre qualité de vie.",
    howItWorks: {
      title: 'La méthode 50/30/20 adaptée au Niger',
      body:
        "Le simulateur s'inspire de la règle 50/30/20 : 50 % des revenus pour les besoins essentiels (loyer, alimentation, transport, santé, scolarité), 30 % pour les envies (loisirs, restaurants, voyages, abonnements), et 20 % pour l'épargne et le remboursement de dettes. Cette répartition est ajustable selon votre situation familiale (nombre d'enfants, charges spécifiques, soutien à la famille élargie souvent significatif au Niger).",
    },
    context: {
      title: 'Postes de dépenses spécifiques au Niger',
      body:
        "Dans le contexte nigérien, certains postes méritent une attention particulière : la solidarité familiale et les transferts vers les proches (souvent 10 à 15 % du budget), les frais de scolarité privée si les enfants sont en école hors public, le coût des consultations médicales et médicaments rarement intégralement pris en charge, et l'entretien éventuel d'un véhicule dans une ville où les transports en commun restent limités.",
    },
    tips: {
      title: 'Construire un budget durable',
      bullets: [
        "Tracer toutes vos dépenses pendant un mois avant de fixer un budget : les chiffres réels surprennent toujours.",
        "Viser un taux d'épargne minimum de 10 %, idéalement 15-20 % si votre situation le permet.",
        "Constituer une épargne de précaution équivalente à 3-6 mois de dépenses essentielles.",
        "Automatiser le virement de l'épargne dès la réception du salaire (paye-toi en premier).",
        "Réviser le budget tous les trimestres pour ajuster aux évolutions de revenus et de prix.",
      ],
    },
  },
};

export function ToolSeoContent({ slug }: { slug: string }) {
  const content = SEO_CONTENT[slug];
  if (!content) return null;

  return (
    <section className="border-t border-black/6 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <div className="prose prose-sm sm:prose-base max-w-none">
          <p className="text-[15px] sm:text-[16px] leading-relaxed text-gray-700 mb-10 text-justify hyphens-auto">
            {content.intro}
          </p>

          <h2 className="text-xl sm:text-2xl font-bold text-[#111] mt-10 mb-3">
            {content.howItWorks.title}
          </h2>
          <p className="text-[15px] leading-relaxed text-gray-700 mb-8 text-justify hyphens-auto">
            {content.howItWorks.body}
          </p>

          <h2 className="text-xl sm:text-2xl font-bold text-[#111] mt-10 mb-3">
            {content.context.title}
          </h2>
          <p className="text-[15px] leading-relaxed text-gray-700 mb-8 text-justify hyphens-auto">
            {content.context.body}
          </p>

          <h2 className="text-xl sm:text-2xl font-bold text-[#111] mt-10 mb-4">
            {content.tips.title}
          </h2>
          <ul className="space-y-2.5 text-[15px] text-gray-700">
            {content.tips.bullets.map((tip) => (
              <li key={tip} className="flex items-start gap-3">
                <span className="mt-2 shrink-0 w-1.5 h-1.5 rounded-full bg-gold" />
                <span className="leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/**
 * Les neuf institutions de la carte « Le système financier de l'UEMOA », dans
 * la page Finance (/finance#institutions), dans l'ordre de la rangée de logos
 * (choix de Raouf du 26/11/2026 : « Carte noire dans la page », « Compact »).
 *
 * Les textes sont ceux de la page vérifiée le 25/11/2026 (sites des
 * institutions) ; quelques phrases ont été retournées le 26/11/2026, sans en
 * changer le sens, pour qu'aucune ne finisse sur deux ou trois mots seuls de
 * 320 à 1 440 px dans la nouvelle mise en page. Les chiffres ne vivent pas ici : la page les lit chaque jour
 * (BCEAO, relevé de la BRVM) ou les prend à l'INS, et ne montre rien d'incertain
 * ni d'antérieur à 2025 (règle de Raouf, 26/11/2026).
 *
 * Logos : fichiers des sites officiels, en deux versions dans
 * public/logos/institutions/ : `<id>.png` (couleurs d'origine, fond transparent)
 * et `<id>-sur-noir.png` (écritures sombres passées en blanc, couleurs gardées,
 * jamais de carré blanc dessous).
 */

export interface InstitutionFinance {
  id: string;
  sigle: string;
  nomComplet: string;
  /** Le rôle en quelques mots, sous le sigle de la tuile. */
  role: string;
  /** Dimensions réelles des deux fichiers de logo (identiques pour les deux versions). */
  logo: { largeur: number; hauteur: number };
  /** Une phrase par élément : un début de phrase ne reste jamais en bout de ligne. */
  presentation: string[];
  pourVous: string[];
  site?: { libelle: string; url: string };
  lienInterne?: { libelle: string; href: string };
}

export const INSTITUTIONS_FINANCE: InstitutionFinance[] = [
  {
    id: 'bceao',
    sigle: 'BCEAO',
    nomComplet: 'Banque centrale des États de l’Afrique de l’Ouest',
    role: 'La banque centrale des huit pays',
    logo: { largeur: 810, hauteur: 360 },
    presentation: [
      'La Banque centrale des États de l’Afrique de l’Ouest émet le franc CFA et conduit la politique monétaire des huit pays de l’Union, depuis son siège de Dakar.',
    ],
    pourVous: [
      'Son taux directeur fixe le prix de l’argent que les banques empruntent auprès d’elle : quand il monte, le crédit coûte plus cher à leurs clients.',
      'Pour protéger le pouvoir d’achat, elle cherche à maintenir l’inflation entre 1 % et 3 % par an.',
      'Elle fixe les règles que suivent les banques, la microfinance et le mobile money.',
    ],
    site: { libelle: 'Le site de la BCEAO', url: 'https://www.bceao.int' },
    lienInterne: { libelle: 'Les cours du jour', href: '/marches' },
  },
  {
    id: 'uemoa',
    sigle: 'UEMOA',
    nomComplet: 'Union économique et monétaire ouest-africaine',
    role: 'L’union économique',
    logo: { largeur: 287, hauteur: 360 },
    presentation: [
      'L’Union économique et monétaire ouest-africaine réunit le Bénin, le Burkina Faso, la Côte d’Ivoire, la Guinée-Bissau, le Mali, le Niger, le Sénégal et le Togo.',
      'Sa Commission, son organe exécutif, siège à Ouagadougou.',
    ],
    pourVous: [
      'Son union douanière supprime les droits de douane sur les produits originaires des huit pays et applique un tarif commun aux produits venus d’ailleurs.',
      'Ses règles budgétaires plafonnent le déficit public à 3 % du PIB et la dette publique à 70 % du PIB, dans chacun des huit pays.',
    ],
    site: { libelle: 'Le site de l’UEMOA', url: 'https://www.uemoa.int' },
    lienInterne: { libelle: 'Le Niger en chiffres', href: '/niger' },
  },
  {
    id: 'brvm',
    sigle: 'BRVM',
    nomComplet: 'Bourse régionale des valeurs mobilières',
    role: 'La Bourse commune',
    logo: { largeur: 521, hauteur: 267 },
    presentation: [
      'La Bourse régionale des valeurs mobilières, installée à Abidjan, est la Bourse des huit pays.',
      'Son dépositaire central, le DC/BR, conserve les titres et règle les achats et les ventes.',
    ],
    pourVous: [
      'Pour acheter une action ou une obligation, il faut ouvrir un compte titres dans une SGI, une société de gestion et d’intermédiation.',
      // La phrase sur Bank of Africa Niger est ajoutée par la page, avec le
      // nombre de sociétés cotées lu dans le dernier relevé.
    ],
    site: { libelle: 'Le site de la BRVM', url: 'https://www.brvm.org' },
    lienInterne: { libelle: 'La séance du jour', href: '/marches' },
  },
  {
    id: 'amf-umoa',
    sigle: 'AMF-UMOA',
    nomComplet: 'Autorité des marchés financiers de l’UMOA',
    role: 'Le gendarme de la Bourse',
    logo: { largeur: 375, hauteur: 98 },
    presentation: [
      'L’Autorité des marchés financiers de l’UMOA surveille le marché financier régional.',
      'Elle s’appelait auparavant le CREPMF, le Conseil régional de l’épargne publique et des marchés financiers.',
    ],
    pourVous: [
      'Elle agrée les SGI et les sociétés de gestion, qui ne peuvent pas exercer sans son autorisation.',
      'Elle contrôle les emprunts et les titres proposés au public avant leur vente.',
      'Avant de confier votre épargne à un intermédiaire, vérifiez auprès d’elle qu’il est bien agréé.',
    ],
    site: { libelle: 'Le site de l’AMF-UMOA', url: 'https://www.amf-umoa.org' },
  },
  {
    id: 'umoa-titres',
    sigle: 'UMOA-Titres',
    nomComplet: 'Agence UMOA-Titres',
    role: 'Là où les États empruntent',
    logo: { largeur: 623, hauteur: 183 },
    presentation: [
      'L’Agence UMOA-Titres, basée à Dakar, organise avec la BCEAO les emprunts des huit États sur le marché régional des titres publics.',
    ],
    pourVous: [
      'Les États y vendent des bons du Trésor à court terme et des obligations à plus long terme, aux investisseurs qui font les meilleures offres.',
      'Le Niger y emprunte souvent pour financer son budget.',
      'Un particulier peut y souscrire en passant par une banque ou par une SGI de l’Union.',
    ],
    site: { libelle: 'Le site d’UMOA-Titres', url: 'https://www.umoatitres.org' },
  },
  {
    id: 'boad',
    sigle: 'BOAD',
    nomComplet: 'Banque ouest-africaine de développement',
    role: 'La banque de développement',
    logo: { largeur: 199, hauteur: 360 },
    presentation: [
      'La Banque ouest-africaine de développement, installée à Lomé, finance des routes, de l’énergie et d’autres projets dans les huit pays.',
    ],
    pourVous: [],
    site: { libelle: 'Le site de la BOAD', url: 'https://www.boad.org' },
  },
  {
    id: 'commission-bancaire',
    sigle: 'Commission bancaire',
    nomComplet: 'Commission bancaire de l’UMOA',
    role: 'Le contrôle des banques',
    logo: { largeur: 245, hauteur: 244 },
    presentation: ['La Commission bancaire de l’UMOA contrôle les banques de l’Union et peut les sanctionner.'],
    pourVous: [],
    site: { libelle: 'Le site de la Commission bancaire', url: 'https://www.cb-umoa.org' },
  },
  {
    id: 'fgdr-umoa',
    sigle: 'FGDR-UMOA',
    nomComplet: 'Fonds de garantie des dépôts et de résolution dans l’UMOA',
    role: 'La garantie de vos dépôts',
    logo: { largeur: 900, hauteur: 342 },
    presentation: [
      'Le Fonds de garantie des dépôts et de résolution indemnise les déposants si leur banque ou leur institution de microfinance fait faillite, jusqu’à un plafond fixé par les ministres de l’Union.',
    ],
    pourVous: [],
    site: { libelle: 'Le site du FGDR-UMOA', url: 'https://www.fgd-umoa.org' },
  },
  {
    id: 'cima',
    sigle: 'CIMA',
    nomComplet: 'Conférence interafricaine des marchés d’assurances',
    role: 'Le contrôle des assurances',
    logo: { largeur: 869, hauteur: 118 },
    presentation: [
      'La Conférence interafricaine des marchés d’assurances encadre les assureurs de plusieurs pays africains, dont le Niger.',
    ],
    pourVous: [],
    site: { libelle: 'Le site de la CIMA', url: 'https://cima-afrique.org' },
  },
];

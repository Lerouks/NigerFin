/**
 * Source de vérité des indicateurs macroéconomiques officiels INS Niger.
 *
 * Sources : Institut National de la Statistique du Niger (INS).
 * - Note de Conjoncture T4 2025 (publication mars 2026)
 * - Bulletin IHPC Avril 2026
 * - Tableau des Opérations Financières de l'État (TOFE) 2025
 * - BCEAO Agrégats monétaires décembre 2025
 *
 * Mise à jour, à chaque nouveau bulletin INS Niger.
 * Convention temporelle, données 2025 racontées en 2026 = passé composé.
 */

export interface MacroIndicator {
  /** Identifiant stable */
  id: string;
  /** Libellé court affichable */
  label: string;
  /** Valeur principale formatée */
  value: string;
  /** Unité (FCFA, %, points, etc.) */
  unit: string;
  /** Période concernée */
  period: string;
  /** Variation sur 1 an si pertinente */
  yearChange?: string;
  /** Variation tendance positive/negative/neutral (pour couleur affichage) */
  trend?: 'up' | 'down' | 'neutral';
  /** Contexte court 1 phrase max */
  context?: string;
  /** Source officielle citable */
  source: string;
}

/**
 * Indicateurs macroéconomiques Niger, snapshot Avril 2026.
 * Données issues exclusivement de publications INS officielles.
 */
export const NIGER_MACRO_INDICATORS: MacroIndicator[] = [
  {
    id: 'ihpc-annual',
    label: "Inflation Niger",
    value: '-7,5',
    unit: '%',
    period: 'Avril 2026, sur 1 an',
    yearChange: '-7,5%',
    trend: 'down',
    context: "Le Niger est en déflation depuis juillet 2025, bien sous la norme UEMOA de 3%.",
    source: 'INS, IHPC Avril 2026',
  },
  {
    id: 'ihpi-annual-2025',
    label: "Production industrielle",
    value: '+33,2',
    unit: '%',
    period: 'Année 2025',
    yearChange: '+33,2%',
    trend: 'up',
    context: "Boost lié à la montée en puissance du secteur pétrolier nigérien.",
    source: 'INS, IHPI T4 2025',
  },
  {
    id: 'state-revenue-2025',
    label: "Recettes État 2025",
    value: '1 308',
    unit: 'Mds FCFA',
    period: 'Janvier à décembre 2025',
    yearChange: '+40,8%',
    trend: 'up',
    context: "Bond des recettes fiscales (+37,7%) reflet de l'élargissement de l'assiette.",
    source: 'INS / DGE-R/MEF, TOFE 2025',
  },
  {
    id: 'budget-balance-2025',
    label: "Solde budgétaire",
    value: '-628',
    unit: 'Mds FCFA',
    period: 'Année 2025',
    yearChange: '+3,1%',
    trend: 'up',
    context: "Léger mieux par rapport à -648 Mds en 2024, malgré la hausse des dépenses d'équipement.",
    source: 'INS / DGE-R/MEF, TOFE 2025',
  },
  {
    id: 'trade-balance-t4-2025',
    label: "Solde commercial",
    value: '-73,0',
    unit: 'Mds FCFA',
    period: 'T4 2025',
    yearChange: 'vs +62,9',
    trend: 'down',
    context: "Retour au déficit après un excédent au T4 2024, dû au repli des exports pétroliers.",
    source: 'INS, Commerce Extérieur T4 2025',
  },
  {
    id: 'money-supply-m2',
    label: "Masse monétaire M2",
    value: '2 182',
    unit: 'Mds FCFA',
    period: 'Fin décembre 2025',
    yearChange: '+10,6%',
    trend: 'up',
    context: "Expansion portée par la reconstitution des réserves de change et la circulation fiduciaire.",
    source: 'BCEAO, Agrégats monétaires décembre 2025',
  },
];

export const COMMODITIES_NIGER_EXPOSED: MacroIndicator[] = [
  {
    id: 'gold-q4-2025',
    label: 'Or',
    value: '4 151',
    unit: '$/once',
    period: 'T4 2025',
    yearChange: '+56,0%',
    trend: 'up',
    context: "Niveau historique. Bénéfique aux exportations aurifères nigériennes.",
    source: 'FMI, Commodity Prices',
  },
  {
    id: 'uranium-q4-2025',
    label: 'Uranium',
    value: '139,42',
    unit: '$/kg',
    period: 'T4 2025',
    yearChange: '-0,1%',
    trend: 'neutral',
    context: "Cours stable sur 1 an. Le Niger reste un fournisseur stratégique mondial.",
    source: 'FMI, Commodity Prices',
  },
  {
    id: 'brent-q4-2025',
    label: 'Pétrole Brent',
    value: '63,16',
    unit: '$/baril',
    period: 'T4 2025',
    yearChange: '-14,6%',
    trend: 'down',
    context: "Le recul du Brent pèse sur les recettes d'exportation du Niger.",
    source: 'FMI, Commodity Prices',
  },
  {
    id: 'iron-ore-q4-2025',
    label: 'Minerai de fer',
    value: '106,90',
    unit: '$/tonne',
    period: 'T4 2025',
    yearChange: '+1,5%',
    trend: 'up',
    context: "Rebond modéré porté par la demande d'acier en Chine.",
    source: 'FMI, Commodity Prices',
  },
];

export const FOOD_PRICES_2025: MacroIndicator[] = [
  {
    id: 'wheat-q4-2025',
    label: 'Blé',
    value: '164,07',
    unit: '$/tonne',
    period: 'T4 2025',
    yearChange: '-13,5%',
    trend: 'down',
    context: "Offre mondiale abondante depuis l'hémisphère nord.",
    source: 'FMI, Commodity Prices',
  },
  {
    id: 'rice-q4-2025',
    label: 'Riz',
    value: '351,77',
    unit: '$/tonne',
    period: 'T4 2025',
    yearChange: '-28,7%',
    trend: 'down',
    context: "Forte baisse après la levée progressive des restrictions à l'export de l'Inde.",
    source: 'FMI, Commodity Prices',
  },
  {
    id: 'corn-q4-2025',
    label: 'Maïs',
    value: '201,66',
    unit: '$/tonne',
    period: 'T4 2025',
    yearChange: '+1,9%',
    trend: 'up',
    context: "Demande d'éthanol et d'alimentation animale soutient les cours.",
    source: 'FMI, Commodity Prices',
  },
  {
    id: 'sugar-q4-2025',
    label: 'Sucre',
    value: '746,12',
    unit: '$/tonne',
    period: 'T4 2025',
    yearChange: '-9,9%',
    trend: 'down',
    context: "Bonne campagne sucrière au Brésil et demande mondiale modérée.",
    source: 'FMI, Commodity Prices',
  },
];

export const INS_LAST_UPDATE = 'Avril 2026';
export const INS_SOURCE_LINK = 'https://www.stat-niger.org';

/**
 * Methodologie editoriale de l'atlas /entreprises.
 * Affichee dans un drawer accessible depuis le hero de la page atlas.
 *
 * Texte stocke ici (pas en DB) : maintenance simple, versionne avec le code.
 * Pour mise a jour : modifier ce fichier + nouveau commit + nouvelle date.
 */

export interface MethodologySection {
  title: string;
  paragraphs: string[];
}

export const METHODOLOGY_LAST_UPDATED = '2026-05-27';

export const METHODOLOGY_SECTIONS: MethodologySection[] = [
  {
    title: 'Pourquoi ces entreprises',
    paragraphs: [
      "Les entreprises retenues dans cet atlas le sont selon trois critères cumulatifs : un poids macro-économique mesurable (contribution au PIB, aux recettes d'exportation ou aux recettes fiscales du Niger), une empreinte sociale significative (effectif employeur de premier rang dans leur secteur), et un rôle stratégique sur une infrastructure essentielle (énergie, mines, télécommunications, finance, agriculture).",
      "Cette sélection privilégie les acteurs structurels de l'économie nigérienne plutôt que les acteurs émergents ou les filiales locales d'entreprises étrangères sans assise nationale.",
    ],
  },
  {
    title: 'Sources et données',
    paragraphs: [
      "Les chiffres affichés (effectifs, chiffres d'affaires, actionnariat, fondation) proviennent exclusivement de sources publiques : rapports d'entreprise, communications officielles du gouvernement nigérien, publications de l'Institut National de la Statistique (INS Niger), de la Banque Centrale des États de l'Afrique de l'Ouest (BCEAO), de la Banque mondiale, du FMI (rapports Article IV) et de la presse économique africaine.",
      "Quand une donnée est contradictoire entre plusieurs sources, nous retenons la plus récente et la plus officielle. Quand une donnée n'est pas disponible publiquement, nous le signalons par la mention ND (non disponible) plutôt que de proposer une estimation.",
    ],
  },
  {
    title: 'Mise à jour et signalements',
    paragraphs: [
      "Cet atlas est revu trimestriellement par la rédaction NFI Report. Les entreprises ajoutées, retirées ou complétées le sont selon les mêmes critères. Toute correction factuelle peut être signalée à l'adresse contact@nfireport.com avec la source documentaire correspondante.",
    ],
  },
];

export const METHODOLOGY_SIGNATURE = 'La rédaction NFI Report';

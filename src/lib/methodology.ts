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
      "Les entreprises retenues dans cet atlas le sont selon trois criteres cumulatifs : un poids macro-economique mesurable (contribution au PIB, aux recettes d'exportation ou aux recettes fiscales du Niger), une empreinte sociale significative (effectif employeur de premier rang dans leur secteur), et un role strategique sur une infrastructure essentielle (energie, mines, telecommunications, finance, agriculture).",
      "Cette selection privilegie les acteurs structurels de l'economie nigerienne plutot que les acteurs emergents ou les filiales locales d'entreprises etrangeres sans assise nationale.",
    ],
  },
  {
    title: 'Sources et donnees',
    paragraphs: [
      "Les chiffres affiches (effectifs, chiffres d'affaires, actionnariat, fondation) proviennent exclusivement de sources publiques : rapports d'entreprise, communications officielles du gouvernement nigerien, publications de l'Institut National de la Statistique (INS Niger), de la Banque Centrale des Etats de l'Afrique de l'Ouest (BCEAO), de la Banque mondiale, du FMI (rapports Article IV) et de la presse economique africaine.",
      "Quand une donnee est contradictoire entre plusieurs sources, nous retenons la plus recente et la plus officielle. Quand une donnee n'est pas disponible publiquement, nous le signalons par la mention ND (non disponible) plutot que de proposer une estimation.",
    ],
  },
  {
    title: 'Mise a jour et signalements',
    paragraphs: [
      "Cet atlas est revu trimestriellement par la redaction NFI Report. Les entreprises ajoutees, retirees ou completees le sont selon les memes criteres. Toute correction factuelle peut etre signalee a l'adresse contact@nfireport.com avec la source documentaire correspondante.",
    ],
  },
];

export const METHODOLOGY_SIGNATURE = 'La redaction NFI Report';

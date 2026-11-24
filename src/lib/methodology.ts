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

export const METHODOLOGY_LAST_UPDATED = '2026-11-24';

// Réécrit le 24/11/2026 : sans « selon » (règle de Raouf), sans promesse de
// revue trimestrielle que personne ne tiendrait, et conforme à l'affichage
// réel (une donnée non publique n'est pas affichée, aucune mention ND).
export const METHODOLOGY_SECTIONS: MethodologySection[] = [
  {
    title: 'Pourquoi ces entreprises',
    paragraphs: [
      "Nous retenons les entreprises qui tiennent un secteur essentiel du pays : les mines, l'énergie, les télécommunications, la banque et l'agriculture. Chacune pèse dans l'économie nationale, par ses recettes, ses exportations ou le service qu'elle rend à tout le territoire.",
      "Cette sélection privilégie les entreprises ancrées au Niger plutôt que les acteurs émergents ou les filiales locales de groupes étrangers.",
    ],
  },
  {
    title: 'Sources et données',
    paragraphs: [
      "Les informations affichées viennent de sources publiques : rapports des entreprises, communications officielles du gouvernement nigérien, Institut national de la statistique (INS), BCEAO, Banque mondiale, FMI et presse économique.",
      "Quand deux sources se contredisent, nous retenons la plus récente et la plus officielle. Quand une donnée n'est pas publique, nous ne l'affichons pas plutôt que de proposer une estimation.",
    ],
  },
  {
    title: 'Corrections',
    paragraphs: [
      "Une erreur ou une donnée dépassée peut nous être signalée à contact@nfireport.com, avec sa source. Nous corrigeons la fiche après vérification.",
    ],
  },
];

export const METHODOLOGY_SIGNATURE = 'La rédaction NFI Report';

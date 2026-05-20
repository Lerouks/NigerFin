/**
 * Génère un PDF de prévisualisation de ToolPdfDocument avec des données
 * mock réalistes (simulateur d'emprunt) puis l'écrit dans /tmp.
 * Permet de QA visuellement le design refondu avant push.
 *
 * Usage : node scripts/pdf-preview.mjs
 * Output : /tmp/nfi-tool-pdf-preview.pdf
 */
import { writeFileSync } from 'node:fs';
import { pdf } from '@react-pdf/renderer';
import React from 'react';
import { ToolPdfDocument } from '../src/components/pdf/ToolPdfDocument.tsx';

const data = {
  title: "Simulateur d'emprunt immobilier",
  eyebrow: 'Outil financier',
  generatedAt: 'Généré le 20 mai 2026 à 04h45',
  params: [
    { label: 'Montant emprunté', value: '25 000 000 FCFA' },
    { label: 'Durée', value: '15 ans' },
    { label: 'Taux nominal annuel', value: '7,80 %' },
    { label: 'Assurance emprunteur', value: '0,36 %' },
    { label: 'Frais de dossier', value: '250 000 FCFA' },
  ],
  results: [
    { label: 'Mensualité', value: '263 412 FCFA' },
    { label: 'Coût total du crédit', value: '22 414 160 FCFA' },
    { label: 'Total à rembourser', value: '47 414 160 FCFA' },
    { label: 'TAEG estimé', value: '8,46 %' },
  ],
  table: {
    head: ['Année', 'Capital restant', 'Intérêts versés', 'Capital remboursé'],
    body: [
      [1, '23 678 921 FCFA', '1 947 254 FCFA', '1 321 079 FCFA'],
      [2, '22 250 412 FCFA', '1 838 437 FCFA', '1 428 509 FCFA'],
      [3, '20 706 691 FCFA', '1 720 219 FCFA', '1 543 721 FCFA'],
      [4, '19 039 432 FCFA', '1 591 681 FCFA', '1 667 259 FCFA'],
      [5, '17 239 776 FCFA', '1 451 824 FCFA', '1 799 656 FCFA'],
      [6, '15 298 287 FCFA', '1 299 565 FCFA', '1 941 489 FCFA'],
      [7, '13 204 936 FCFA', '1 133 720 FCFA', '2 093 351 FCFA'],
      [8, '10 949 075 FCFA', '953 003 FCFA', '2 255 861 FCFA'],
      [9, '8 519 414 FCFA', '756 003 FCFA', '2 429 661 FCFA'],
      [10, '5 903 989 FCFA', '541 219 FCFA', '2 615 425 FCFA'],
      [11, '3 090 137 FCFA', '307 102 FCFA', '2 813 852 FCFA'],
      [12, '64 461 FCFA', '51 706 FCFA', '3 025 676 FCFA'],
    ],
  },
  recommendations: [
    "Un apport personnel de 20 % minimum réduit significativement le coût total du crédit et améliore les conditions de négociation avec la banque.",
    "Négocier la délégation d'assurance emprunteur peut faire économiser jusqu'à 30 % sur cette ligne, soit plusieurs centaines de milliers de FCFA sur 15 ans.",
    'Vérifier que les mensualités ne dépassent pas 33 % de vos revenus nets, seuil prudentiel généralement appliqué par les banques de la place.',
    'Comparer au moins trois offres bancaires sur la place de Niamey avant de signer, les écarts de taux pouvant atteindre 1,5 point.',
  ],
};

const blob = await pdf(React.createElement(ToolPdfDocument, { data })).toBlob();
const buf = Buffer.from(await blob.arrayBuffer());
const out = '/tmp/nfi-tool-pdf-preview.pdf';
writeFileSync(out, buf);
console.log(`PDF written: ${out} (${buf.length} bytes)`);

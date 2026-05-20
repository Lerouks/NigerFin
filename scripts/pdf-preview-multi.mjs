/**
 * Génère plusieurs PDFs avec des données variées pour QA pagination.
 * Cherche les orphelins (1 ligne seule sur une page).
 */
import { writeFileSync } from 'node:fs';
import { pdf } from '@react-pdf/renderer';
import React from 'react';
import { ToolPdfDocument } from '../src/components/pdf/ToolPdfDocument.tsx';

const FCFA = (n) =>
  Math.round(n).toLocaleString('fr-FR').replace(/ /g, ' ') + ' FCFA';

const baseDate = 'Généré le 20 mai 2026 à 04h45';

const scenarios = {
  'court-1page': {
    title: "Intérêt simple",
    eyebrow: 'Outil financier',
    generatedAt: baseDate,
    params: [
      { label: 'Capital', value: '500 000 FCFA' },
      { label: 'Taux', value: '5 %' },
      { label: 'Durée', value: '2 ans' },
    ],
    results: [
      { label: 'Intérêts', value: '50 000 FCFA' },
      { label: 'Total', value: '550 000 FCFA' },
    ],
    recommendations: [
      "Placer le capital sur un produit garanti pour conserver le rendement.",
      "Vérifier la fiscalité applicable au Niger sur les intérêts perçus.",
    ],
  },

  'moyen-5ans': {
    title: "Simulateur d'emprunt immobilier",
    eyebrow: 'Outil financier',
    generatedAt: baseDate,
    params: [
      { label: 'Montant emprunté', value: '10 000 000 FCFA' },
      { label: 'Durée', value: '5 ans' },
      { label: 'Taux nominal annuel', value: '6,50 %' },
      { label: 'Assurance', value: '0,36 %' },
    ],
    results: [
      { label: 'Mensualité', value: '198 432 FCFA' },
      { label: 'Coût total', value: '1 905 920 FCFA' },
      { label: 'TAEG', value: '7,12 %' },
    ],
    table: {
      head: ['Année', 'Capital restant', 'Intérêts'],
      body: Array.from({ length: 5 }, (_, i) => [
        i + 1,
        FCFA(8000000 - i * 1600000),
        FCFA(650000 - i * 100000),
      ]),
    },
    recommendations: [
      "Comparer 3 offres bancaires avant signature.",
      "Vérifier la possibilité de remboursement anticipé sans pénalités.",
      "Négocier l'assurance emprunteur en délégation.",
    ],
  },

  'long-25ans': {
    title: "Simulateur d'emprunt immobilier",
    eyebrow: 'Outil financier',
    generatedAt: baseDate,
    params: [
      { label: 'Montant emprunté', value: '50 000 000 FCFA' },
      { label: 'Durée', value: '25 ans' },
      { label: 'Taux nominal annuel', value: '8,20 %' },
      { label: 'Assurance', value: '0,42 %' },
      { label: 'Frais de dossier', value: '500 000 FCFA' },
    ],
    results: [
      { label: 'Mensualité', value: '402 156 FCFA' },
      { label: 'Coût total', value: '70 646 800 FCFA' },
      { label: 'Total à rembourser', value: '120 646 800 FCFA' },
      { label: 'TAEG', value: '8,91 %' },
    ],
    table: {
      head: ['Année', 'Capital restant', 'Intérêts versés', 'Capital remboursé'],
      body: Array.from({ length: 25 }, (_, i) => [
        i + 1,
        FCFA(50000000 - (i + 1) * 1500000),
        FCFA(4000000 - i * 130000),
        FCFA(1000000 + i * 130000),
      ]),
    },
    recommendations: [
      "Un apport personnel de 30 % réduit drastiquement le coût total sur 25 ans.",
      "Sur une durée longue, négocier l'assurance peut économiser plus de 4 millions.",
      "Vérifier la stabilité de vos revenus sur l'horizon de l'emprunt.",
      "Anticiper les évolutions du taux directeur BCEAO.",
    ],
  },

  'borderline-11rows': {
    title: "Crédit auto sur 11 ans",
    eyebrow: 'Outil financier',
    generatedAt: baseDate,
    params: [
      { label: 'Montant', value: '8 500 000 FCFA' },
      { label: 'Durée', value: '11 ans' },
      { label: 'Taux', value: '7,00 %' },
    ],
    results: [
      { label: 'Mensualité', value: '87 234 FCFA' },
      { label: 'Coût total', value: '3 015 288 FCFA' },
    ],
    table: {
      head: ['Année', 'Capital restant', 'Intérêts', 'Remboursé'],
      body: Array.from({ length: 11 }, (_, i) => [
        i + 1,
        FCFA(8500000 - (i + 1) * 700000),
        FCFA(550000 - i * 35000),
        FCFA(200000 + i * 25000),
      ]),
    },
    recommendations: [
      "Considérer un crédit auto plus court pour réduire le coût.",
      "Vérifier l'assurance véhicule incluse vs séparée.",
      "Calculer le coût total possession (carburant, entretien) avant achat.",
    ],
  },
};

for (const [name, data] of Object.entries(scenarios)) {
  const blob = await pdf(React.createElement(ToolPdfDocument, { data })).toBlob();
  const buf = Buffer.from(await blob.arrayBuffer());
  const out = `/tmp/nfi-pdf-${name}.pdf`;
  writeFileSync(out, buf);
  console.log(`${out} (${buf.length} bytes)`);
}

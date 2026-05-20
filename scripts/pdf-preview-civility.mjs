/**
 * Genere des previews PDF avec et sans civilite pour QA visuel.
 */
import { writeFileSync } from 'node:fs';
import { pdf } from '@react-pdf/renderer';
import React from 'react';
import { ToolPdfDocument } from '../src/components/pdf/ToolPdfDocument.tsx';

const baseData = {
  title: "Simulateur d'emprunt immobilier",
  eyebrow: 'Outil financier',
  generatedAt: 'Généré le 20 mai 2026 à 04h45',
  params: [
    { label: 'Montant emprunté', value: '15 000 000 FCFA' },
    { label: 'Durée', value: '10 ans' },
    { label: 'Taux nominal', value: '7,50 %' },
  ],
  results: [
    { label: 'Mensualité', value: '178 451 FCFA' },
    { label: 'Coût total', value: '6 414 120 FCFA' },
  ],
  recommendations: [
    "Comparer 3 offres bancaires avant signature.",
    "Négocier l'assurance emprunteur en délégation.",
  ],
};

const variants = {
  'avec-monsieur': { ...baseData, recipientCivility: 'M.', recipientName: 'NFI Report' },
  'avec-madame': { ...baseData, recipientCivility: 'Mme', recipientName: 'Aïcha Mounkaila' },
  'sans-civilite': { ...baseData, recipientCivility: null, recipientName: 'Mohamed Issoufou' },
  'sans-info': { ...baseData },
};

for (const [name, data] of Object.entries(variants)) {
  const blob = await pdf(React.createElement(ToolPdfDocument, { data })).toBlob();
  const buf = Buffer.from(await blob.arrayBuffer());
  const out = `/tmp/nfi-pdf-civility-${name}.pdf`;
  writeFileSync(out, buf);
  console.log(`${out}`);
}

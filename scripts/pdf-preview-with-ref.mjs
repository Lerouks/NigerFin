/**
 * Preview du PDF avec une reference NFI-YYYY-NNNN injectee (simule
 * ce que pdf-create renvoie en prod).
 */
import { writeFileSync } from 'node:fs';
import { pdf } from '@react-pdf/renderer';
import React from 'react';
import { ToolPdfDocument } from '../src/components/pdf/ToolPdfDocument.tsx';

const data = {
  title: "Simulateur d'emprunt immobilier",
  eyebrow: 'Outil financier',
  generatedAt: 'Généré le 20 mai 2026 à 04h45',
  reference: 'NFI-2026-0042',
  recipientCivility: 'M.',
  recipientName: 'Diallo',
  params: [
    { label: 'Montant emprunté', value: '25 000 000 FCFA' },
    { label: 'Durée', value: '15 ans' },
    { label: 'Taux nominal', value: '7,80 %' },
  ],
  results: [
    { label: 'Mensualité', value: '263 412 FCFA' },
    { label: 'Coût total', value: '22 414 160 FCFA' },
  ],
  recommendations: [
    "Apport personnel 20 % minimum recommande pour reduire le cout total.",
  ],
};
const blob = await pdf(React.createElement(ToolPdfDocument, { data })).toBlob();
writeFileSync('/tmp/pdf-ref.pdf', Buffer.from(await blob.arrayBuffer()));
console.log('written /tmp/pdf-ref.pdf');

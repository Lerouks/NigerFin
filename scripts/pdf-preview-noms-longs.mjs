/**
 * Stress-test du PDF avec des noms reels longs ou composés.
 * Reproduit la logique de /api/tools/pdf-verify (last_name si dispo,
 * sinon dernier mot du full_name) pour QA realiste.
 */
import { writeFileSync } from 'node:fs';
import { pdf } from '@react-pdf/renderer';
import React from 'react';
import { ToolPdfDocument } from '../src/components/pdf/ToolPdfDocument.tsx';

// Reprend la logique de l'API pour deriver le nom affiche
function deriveRecipientName(profile) {
  let name = (profile.last_name ?? '').trim();
  if (!name && profile.full_name) {
    const parts = profile.full_name.trim().split(/\s+/).filter(Boolean);
    name = parts.length > 0 ? (parts[parts.length - 1] ?? '') : '';
  }
  return name;
}

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
  ],
};

// Profils realistes : ce que l'API recoit, et ce qu'elle derive
const profiles = [
  { name: 'court-1mot',         civility: 'M.',  full_name: 'Amadou Diallo',                          last_name: null },
  { name: 'avec-last-name',     civility: 'Mme', full_name: 'Aïcha Mounkaila',                        last_name: 'Mounkaila' },
  { name: 'tres-long-fullname', civility: 'M.',  full_name: 'Almoustafa Mohamadou Ibrahim Diallo Sow', last_name: null },
  { name: 'nom-compose',        civility: 'Mme', full_name: 'Aïssatou Diallo',                        last_name: 'Diallo-Sow' },
  { name: 'hausa',              civility: 'M.',  full_name: 'Cheikh Mohamed Ould Ibrahim',            last_name: null },
  { name: 'long-last-name',     civility: 'Mme', full_name: 'Marie Dupont',                           last_name: 'Diallo-Sow-Bagayogo' },
  { name: 'accents',            civility: 'Mme', full_name: 'Fatoumata Ousseïni',                     last_name: 'Ousseïni-Maïga' },
];

for (const p of profiles) {
  const recipientName = deriveRecipientName(p);
  const data = {
    ...baseData,
    recipientCivility: p.civility,
    recipientName,
  };
  const blob = await pdf(React.createElement(ToolPdfDocument, { data })).toBlob();
  const buf = Buffer.from(await blob.arrayBuffer());
  const out = `/tmp/nfi-noms-${p.name}.pdf`;
  writeFileSync(out, buf);
  console.log(`${p.name.padEnd(25)} -> "${p.civility} ${recipientName}"`);
}

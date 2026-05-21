#!/usr/bin/env node
/**
 * Génère une paire de clés VAPID (Voluntary Application Server Identification)
 * nécessaires au système Web Push du Cockpit admin NFI Report.
 *
 * À lancer UNE SEULE FOIS pour générer les clés. Ensuite, les ajouter
 * manuellement aux variables d'environnement Vercel et à `.env.local`.
 *
 * Usage : node scripts/generate-vapid-keys.mjs
 */

import webpush from 'web-push';

const keys = webpush.generateVAPIDKeys();

const lines = [
  '',
  '====================================================================',
  '  Clés VAPID générées avec succès',
  '====================================================================',
  '',
  'Copie les 3 lignes ci-dessous dans :',
  '  1. Vercel (Settings > Environment Variables, scope Production + Preview + Development)',
  '  2. Ton fichier local `.env.local` (à la racine du projet)',
  '',
  '/-------------------- COPIER À PARTIR D\'ICI --------------------/',
  '',
  `VAPID_PUBLIC_KEY=${keys.publicKey}`,
  `VAPID_PRIVATE_KEY=${keys.privateKey}`,
  'VAPID_SUBJECT=mailto:contact@nfireport.com',
  '',
  '/-------------------- JUSQU\'À LÀ -------------------------------/',
  '',
  'IMPORTANT :',
  '  - Ne committe JAMAIS la clé privée (VAPID_PRIVATE_KEY) dans Git.',
  '  - La clé publique (VAPID_PUBLIC_KEY) est exposée au navigateur, c\'est normal.',
  '  - Une fois ces clés en place, redéploie le projet sur Vercel pour activer les notifs.',
  '  - Les abonnements push existants seront invalidés si tu régénères les clés.',
  '',
  '====================================================================',
  '',
];

for (const line of lines) {
  console.log(line);
}

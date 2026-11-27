/**
 * Met en ligne les 7 mails de connexion (objets et contenus) dans la
 * configuration auth du projet Supabase de production.
 * À lancer seulement avec l'accord de Raouf, après relecture des rendus.
 *
 * Usage : SUPABASE_ACCESS_TOKEN=... node scripts/appliquer-modeles-connexion.mjs [--essai]
 * --essai affiche ce qui serait envoyé, sans rien modifier.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const PROJET = 'golrvonbqivqzywprjoo';
const dossier = join(process.cwd(), 'supabase', 'templates');
const objets = JSON.parse(readFileSync(join(dossier, 'objets.json'), 'utf-8'));
const fichiers = { confirmation: 'confirmation', magic_link: 'magic-link', recovery: 'recovery', email_change: 'email-change', invite: 'invite', reauthentication: 'reauthentication', email_changed_notification: 'email-changed' };

const corps = {};
for (const [cle, fichier] of Object.entries(fichiers)) {
  corps[`mailer_subjects_${cle}`] = objets[cle];
  corps[`mailer_templates_${cle}_content`] = readFileSync(join(dossier, `${fichier}.html`), 'utf-8');
}

if (process.argv.includes('--essai')) {
  for (const [k, v] of Object.entries(corps)) console.log(k, k.includes('subjects') ? v : `${v.length} caractères`);
  process.exit(0);
}
const jeton = process.env.SUPABASE_ACCESS_TOKEN;
if (!jeton) { console.error('SUPABASE_ACCESS_TOKEN manquant'); process.exit(1); }
const r = await fetch(`https://api.supabase.com/v1/projects/${PROJET}/config/auth`, {
  method: 'PATCH',
  headers: { Authorization: `Bearer ${jeton}`, 'Content-Type': 'application/json' },
  body: JSON.stringify(corps),
});
console.log('réponse', r.status);
if (!r.ok) { console.error(await r.text()); process.exit(1); }

/**
 * Génère les 6 mails de connexion envoyés par Supabase (inscription, lien de
 * connexion, mot de passe oublié, changement d'adresse, invitation, code de
 * vérification) dans le design « Édition », avec le même code que les mails
 * du site (src/lib/emails/edition.ts).
 *
 * Usage : npx tsx scripts/generer-modeles-connexion.ts
 * Sortie : supabase/templates/*.html et supabase/templates/objets.json
 *
 * La mise en ligne (configuration auth du projet Supabase) se fait à part, avec
 * scripts/appliquer-modeles-connexion.mjs, et seulement avec l'accord de Raouf.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  adresseBrute, blanc, bouton, documentEdition, fiche, filet, para, paraHtml, rangee, signature, titre,
} from '@/lib/emails/edition';

// Variables Go de Supabase, protégées pendant la typographie (aucune espace à souder).
const URL_ = '§URL§';
const EMAIL_ = '§EMAIL§';
const NOUVELLE_ = '§NOUVELLE§';
const CODE_ = '§CODE§';
const variables = (h: string) => h
  .replaceAll(URL_, '{{ .ConfirmationURL }}')
  .replaceAll(EMAIL_, '{{ .Email }}')
  .replaceAll(NOUVELLE_, '{{ .NewEmail }}')
  .replaceAll(CODE_, '{{ .Token }}');

interface Modele {
  fichier: string;
  cle: string;
  objet: string;
  apercu: string;
  titre: string;
  corps: string[];
  /** Adresse affichée dans une fiche sous le texte : [libellé, variable]. */
  adresse?: [string, string];
  suite?: string[];
  bouton?: string;
  validite?: string;
  code?: boolean;
  fin: string;
  raison: string;
}

const MODELES: Modele[] = [
  {
    fichier: 'confirmation', cle: 'confirmation',
    objet: 'Confirmez votre adresse pour activer votre compte',
    apercu: 'Un clic suffit pour activer votre compte.',
    titre: 'Activez votre compte',
    corps: ['Pour activer le compte NFI REPORT que vous venez de créer, confirmez que cette adresse est bien la vôtre.'],
    adresse: ['Adresse', EMAIL_],
    bouton: 'Confirmer mon adresse',
    validite: 'Ce lien reste valable une heure.',
    fin: "Si vous n'avez pas créé de compte, ignorez simplement ce message, et aucun compte ne sera activé.",
    raison: "Vous recevez ce message parce qu'un compte NFI REPORT vient d'être créé avec cette adresse.",
  },
  {
    fichier: 'magic-link', cle: 'magic_link',
    objet: 'Votre lien de connexion à NFI REPORT',
    apercu: 'Il ne sert qu’une fois.',
    titre: 'Votre lien de connexion',
    corps: ['Voici le lien pour vous connecter à votre compte NFI REPORT, sans mot de passe.'],
    bouton: 'Me connecter',
    validite: "Ce lien ne sert qu'une fois et reste valable une heure.",
    fin: "Si vous n'avez pas demandé ce lien, ignorez simplement ce message.",
    raison: "Vous recevez ce message parce qu'une connexion à votre compte NFI REPORT a été demandée.",
  },
  {
    fichier: 'recovery', cle: 'recovery',
    objet: 'Choisissez un nouveau mot de passe',
    apercu: 'Le lien reste valable une heure.',
    titre: 'Nouveau mot de passe',
    corps: [
      'Vous avez demandé un nouveau mot de passe.',
      "Le bouton suivant vous permet d'en choisir un nouveau.",
    ],
    bouton: 'Choisir un nouveau mot de passe',
    validite: 'Ce lien reste valable une heure.',
    fin: "Si vous n'avez rien demandé, ignorez ce message : votre mot de passe actuel reste valable.",
    raison: "Vous recevez ce message parce qu'un nouveau mot de passe a été demandé pour votre compte NFI REPORT.",
  },
  {
    fichier: 'email-change', cle: 'email_change',
    objet: 'Confirmez votre nouvelle adresse',
    apercu: 'Un clic suffit pour valider le changement.',
    titre: 'Confirmez votre nouvelle adresse',
    corps: ["Vous avez demandé à remplacer l'adresse de votre compte NFI REPORT."],
    adresse: ['Nouvelle adresse', NOUVELLE_],
    suite: ['Confirmez ce changement avec le bouton suivant.'],
    bouton: 'Confirmer la nouvelle adresse',
    validite: 'Ce lien reste valable une heure.',
    fin: "Si vous n'êtes pas à l'origine de cette demande, ignorez ce message : votre adresse ne change pas.",
    raison: "Vous recevez ce message parce qu'un changement d'adresse a été demandé sur votre compte NFI REPORT.",
  },
  {
    fichier: 'invite', cle: 'invite',
    objet: 'Vous êtes invité à rejoindre NFI REPORT',
    apercu: 'Créez votre compte en un clic.',
    titre: 'Vous êtes invité sur NFI REPORT',
    corps: ["L'équipe de NFI REPORT vous invite à ouvrir votre compte sur le site."],
    bouton: "Accepter l'invitation",
    fin: 'Si cette invitation ne vous concerne pas, ignorez simplement ce message.',
    raison: "Vous recevez ce message parce que l'équipe de NFI REPORT vous a invité à créer un compte.",
  },
  {
    fichier: 'reauthentication', cle: 'reauthentication',
    objet: 'Votre code de vérification',
    apercu: 'Le code à saisir sur le site.',
    titre: 'Votre code de vérification',
    corps: ["Voici le code à saisir sur le site pour confirmer l'opération en cours."],
    code: true,
    fin: "Si vous n'avez rien demandé, ignorez simplement ce message.",
    raison: "Vous recevez ce message parce qu'une vérification a été demandée sur votre compte NFI REPORT.",
  },
];

const sortie = join(process.cwd(), 'supabase', 'templates');
const objets: Record<string, string> = {};
for (const m of MODELES) {
  let corps = titre(m.titre) + paraHtml('Bonjour,', { marge: '22px 0 0' }) + m.corps.map((p) => para(p)).join('')
    + (m.adresse ? blanc(20) + fiche([[m.adresse[0], `<span style="font-weight:400;font-size:14px;">${m.adresse[1]}</span>`]]) : '')
    + (m.suite ? m.suite.map((p) => para(p, { marge: '20px 0 0' })).join('') : '');
  if (m.bouton) {
    corps += blanc(28) + bouton(m.bouton, URL_);
    corps += (m.validite ? para(m.validite, { role: 'doux', taille: 14, hauteur: 22, marge: '26px 0 0' }) : '')
      + para("Si le bouton ne s'ouvre pas, copiez cette adresse dans votre navigateur :", { role: 'doux', taille: 14, hauteur: 22, marge: m.validite ? '8px 0 0' : '26px 0 0' })
      + adresseBrute(URL_);
  }
  if (m.code) {
    corps += blanc(22) + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" class="b-fort" style="border-top:1px solid #111111;border-bottom:1px solid #111111;padding:22px 0;">`
      + `<span class="c-encre" style="font-family:'SF Mono',Menlo,Consolas,'Roboto Mono',monospace;font-size:34px;line-height:40px;font-weight:600;letter-spacing:0.28em;color:#111111;">${CODE_}</span></td></tr></table>`;
  }
  corps += blanc(24) + filet() + para(m.fin, { role: 'doux', taille: 14, hauteur: 22, marge: '18px 0 0' }) + signature();
  const html = documentEdition({
    objet: m.objet,
    apercu: m.apercu,
    folio: ['Votre compte', 'nfireport.com'],
    raison: m.raison,
    corps: rangee(corps, 42),
  });
  writeFileSync(join(sortie, `${m.fichier}.html`), variables(html), 'utf-8');
  objets[m.cle] = m.objet;
}
writeFileSync(join(sortie, 'objets.json'), `${JSON.stringify(objets, null, 2)}\n`, 'utf-8');
process.stdout.write(`${MODELES.length} modèles écrits dans supabase/templates\n`);

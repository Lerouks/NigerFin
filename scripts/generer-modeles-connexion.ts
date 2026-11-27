/**
 * Génère les 7 mails de connexion envoyés par Supabase (inscription, lien de
 * connexion, mot de passe oublié, changement d'adresse, invitation, code de
 * vérification, alerte « adresse changée ») dans le design « Cadre », avec le même code que les mails
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
  /** Le code se lit avant le bouton (inscription : le code d'abord, le lien en secours). */
  codeAvant?: boolean;
  fin: string;
  raison: string;
}

const MODELES: Modele[] = [
  {
    // Le code à 6 chiffres d'abord, tapé sur le site sans le quitter (décision de
    // Raouf, 26/11/2026) ; le bouton reste pour qui préfère cliquer.
    fichier: 'confirmation', cle: 'confirmation',
    objet: 'Confirmez votre adresse pour activer votre compte',
    apercu: 'Votre code à 6 chiffres, à taper sur le site.',
    titre: 'Activez votre compte',
    corps: ['Pour activer le compte NFI REPORT que vous venez de créer, tapez ce code sur le site.'],
    code: true,
    codeAvant: true,
    adresse: ['Adresse', EMAIL_],
    suite: ['Vous pouvez aussi confirmer votre adresse avec le bouton suivant.'],
    bouton: 'Confirmer mon adresse',
    validite: 'Le code et le lien restent valables une heure.',
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
    bouton: 'Choisir un nouveau mot\u00a0de\u00a0passe',
    validite: 'Ce lien reste valable une heure.',
    fin: "Si vous n'avez rien demandé, ignorez ce message : votre mot de passe actuel reste valable.",
    raison: "Vous recevez ce message parce qu'un nouveau mot de passe a été demandé pour votre compte.",
  },
  {
    fichier: 'email-change', cle: 'email_change',
    objet: 'Confirmez votre nouvelle adresse',
    apercu: 'Un clic suffit pour valider le changement.',
    titre: 'Confirmez votre nouvelle adresse',
    corps: ["Vous avez demandé à changer l'adresse e-mail de votre compte."],
    adresse: ['Nouvelle adresse', NOUVELLE_],
    suite: ['Confirmez ce changement avec le bouton suivant.'],
    bouton: 'Confirmer la nouvelle adresse',
    validite: 'Ce lien reste valable une heure.',
    fin: "Si vous n'êtes pas à l'origine de cette demande, ignorez ce message : votre adresse ne change pas.",
    raison: "Vous recevez ce message parce qu'un changement d'adresse a été demandé sur votre compte.",
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
    corps: ["Voici le code à saisir sur le site pour confirmer votre opération."],
    code: true,
    fin: "Si vous n'avez rien demandé, ignorez simplement ce message.",
    raison: "Vous recevez ce message parce qu'une vérification a été demandée sur votre compte NFI REPORT.",
  },
  {
    // Envoyé à l'ancienne adresse une fois le changement fait (alerte activée le 27/11/2026).
    fichier: 'email-changed', cle: 'email_changed_notification',
    objet: 'L’adresse e-mail de votre compte a changé',
    apercu: 'Votre compte NFI REPORT a une nouvelle adresse.',
    titre: 'Votre adresse a changé',
    corps: ["L'adresse e-mail de votre compte NFI REPORT vient de changer. Les messages du site partiront désormais vers la nouvelle."],
    adresse: ['Nouvelle adresse', EMAIL_],
    fin: "Si ce changement ne vient pas de vous, écrivez-nous à contact@nfireport.com.",
    raison: "Vous recevez ce message parce que l'adresse de votre compte NFI REPORT a changé.",
  },
];

const sortie = join(process.cwd(), 'supabase', 'templates');
const objets: Record<string, string> = {};
for (const m of MODELES) {
  const blocCode = blanc(24) + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="f-bloc" bgcolor="#f5f5f6" style="background:#f5f5f6;border-radius:6px;border-collapse:separate;"><tr><td align="center" style="padding:24px 0 26px;">`
    + `<span class="c-encre" style="font-family:'SF Mono',Menlo,Consolas,'Roboto Mono',monospace;font-size:34px;line-height:40px;font-weight:600;letter-spacing:0.28em;color:#111111;">${CODE_}</span></td></tr></table>`;
  let corps = titre(m.titre) + paraHtml('Bonjour,', { marge: '22px 0 0' }) + m.corps.map((p) => para(p)).join('')
    + (m.code && m.codeAvant ? blocCode : '')
    + (m.adresse ? blanc(22) + fiche([[m.adresse[0], m.adresse[1]]]) : '')
    + (m.suite ? m.suite.map((p) => para(p, { marge: '20px 0 0' })).join('') : '');
  if (m.bouton) {
    corps += blanc(28) + bouton(m.bouton, URL_);
    corps += (m.validite ? para(m.validite, { role: 'doux', taille: 14, hauteur: 22, marge: '26px 0 0' }) : '')
      + para("Si le bouton ne s'ouvre pas, copiez cette adresse dans votre navigateur :", { role: 'doux', taille: 14, hauteur: 22, marge: m.validite ? '8px 0 0' : '26px 0 0' })
      + adresseBrute(URL_);
  }
  if (m.code && !m.codeAvant) corps += blocCode;
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

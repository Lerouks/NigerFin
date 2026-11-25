import { SITE_URL } from '@/lib/config';
import { NFI_GROUP_ISSUER } from '@/types/invoice';
import {
  NB,
  blanc,
  ecrireAuContact,
  bouton,
  citation,
  documentEdition,
  encart,
  esc,
  fiche,
  lienFleche,
  listeNumerotee,
  para,
  paraHtml,
  rangee,
  signature,
  soude,
  titre,
  typo,
} from '@/lib/emails/edition';
import { TEXTES, dureeFormule } from '@/lib/emails/textes';
import { defaultSocialLinks } from '@/lib/site-data';

/**
 * E-mails transactionnels de NFI REPORT, design « Cadre » (23/11/2026).
 *
 * La mise en page vit dans src/lib/emails/edition.ts, les textes dans
 * src/lib/emails/textes.ts. Les signatures des fonctions sont inchangées :
 * registre, routes d'envoi et Cockpit continuent de les appeler telles quelles.
 */

function dateFr(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function montantXof(amount: number): string {
  return `${amount.toLocaleString('fr-FR').replace(/\s/g, NB)}${NB}FCFA`;
}

/** « Bonjour Amadou Diallo, » avec la valeur échappée. */
function bonjour(nom: string): string {
  return paraHtml(`Bonjour ${esc(nom)},`, { marge: '22px 0 0' });
}

const FOLIO_SITE = 'nfireport.com';

// ─── Compte ──────────────────────────────────────────────────────────────────

export function welcomeSignupEmail(name: string): { subject: string; html: string } {
  const t = TEXTES.welcome_signup;
  return {
    subject: t.objet,
    html: documentEdition({
      objet: t.objet,
      apercu: t.apercu,
      folio: [t.folio, FOLIO_SITE],
      raison: t.raison,
      corps: rangee(
        titre(t.titre)
        + bonjour(name)
        + para(t.intro)
        + listeNumerotee([
          { titre: t.articlesTitre, texte: t.articles, lien: [t.articlesLien, `${SITE_URL}/articles`] },
          { titre: t.simulateursTitre, texte: t.simulateurs, lien: [t.simulateursLien, `${SITE_URL}/simulateurs`] },
          { titre: t.premiumTitre, texte: t.premium, lien: [t.premiumLien, `${SITE_URL}/pricing`] },
        ])
        + blanc(30) + bouton(t.bouton, `${SITE_URL}/articles`)
        + signature(t.salut),
        42,
      ),
    }),
  };
}

export function passwordChangedEmail(name: string): { subject: string; html: string } {
  const t = TEXTES.password_changed;
  return {
    subject: t.objet,
    html: documentEdition({
      objet: t.objet,
      apercu: t.apercu,
      folio: [t.folio, FOLIO_SITE],
      raison: t.raison,
      corps: rangee(
        titre(t.titre)
        + bonjour(name)
        + para(t.modifie)
        + para(t.vous, { role: 'encre', graisse: 600 })
        + para(t.pasVous)
        + para(t.prevenir)
        + blanc(28) + bouton(t.bouton, `${SITE_URL}/connexion`)
        + signature(),
        42,
      ),
    }),
  };
}

export function adminDowngradeToFreeEmail(name: string): { subject: string; html: string } {
  const t = TEXTES.admin_downgrade_to_free;
  return {
    subject: t.objet,
    html: documentEdition({
      objet: t.objet,
      apercu: t.apercu,
      folio: [t.folio, FOLIO_SITE],
      raison: t.raison,
      corps: rangee(
        titre(t.titre)
        + bonjour(name)
        + para(t.retire)
        + para(t.effet)
        + para(t.retour)
        + blanc(28) + bouton(t.bouton, `${SITE_URL}/pricing`)
        + signature(),
        42,
      ),
    }),
  };
}

// ─── Newsletter ──────────────────────────────────────────────────────────────

export function newsletterWelcomeEmail(unsubscribeUrl?: string): { subject: string; html: string } {
  const t = TEXTES.newsletter_welcome;
  return {
    subject: t.objet,
    html: documentEdition({
      objet: t.objet,
      apercu: t.apercu,
      folio: [t.folio, FOLIO_SITE],
      raison: t.raison,
      liens: [['nfireport.com', SITE_URL], ['Confidentialité', `${SITE_URL}/confidentialite`], [t.desabonner, unsubscribeUrl ?? ecrireAuContact(t.desabonner)]],
      corps: rangee(
        titre(t.titre)
        + para(t.intro, { taille: 17, hauteur: 28, marge: '20px 0 0' })
        + para(t.articles)
        + blanc(26) + bouton(t.bouton, `${SITE_URL}/articles`)
        + blanc(34)
        + encart(
          `<p class="c-encre" style="margin:0;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:18px;line-height:24px;font-weight:700;color:#111111;">${soude(t.premiumTitre)}</p>`
          + para(t.premium, { taille: 15, hauteur: 24, marge: '8px 0 0' })
          + lienFleche(t.premiumLien, `${SITE_URL}/pricing`, '12px 0 0'),
        )
        + signature(),
        42,
      ),
    }),
  };
}

/**
 * Confirmation de la liste d'attente (pré-lancement). La page promet : « Votre
 * adresse ne sert qu'à vous prévenir de l'ouverture ». Ce mail le confirme,
 * et propose de suivre NFI REPORT en attendant. Aucun lien pour quitter la liste :
 * une fois inscrit, c'est fait (décision de Raouf, 23/11/2026).
 * `whatsappUrl` : lien de la chaîne WhatsApp NFI REPORT (bloc masqué si absent).
 */
export function waitlistConfirmationEmail({ whatsappUrl }: { whatsappUrl?: string } = {}): { subject: string; html: string } {
  const t = TEXTES.waitlist_confirmation;
  const reseaux: Array<[string, string]> = [
    ['Facebook', defaultSocialLinks.facebook],
    ['Instagram', defaultSocialLinks.instagram],
    ['TikTok', defaultSocialLinks.tiktok],
    ['YouTube', defaultSocialLinks.youtube],
  ].filter((r): r is [string, string] => Boolean(r[1]))
    .map(([nom, url]) => [nom, url.split('?')[0] ?? url]);
  const sep = ' <span class="c-doux" style="color:#6b6f76;">·</span> ';
  const lienReseau = ([nom, url]: [string, string]) => `<a href="${url}" class="c-encre" style="color:#111111;text-decoration:underline;font-weight:600;">${nom}</a>`;
  const paires: string[] = [];
  for (let i = 0; i < reseaux.length; i += 2) paires.push(`<span style="white-space:nowrap;">${reseaux.slice(i, i + 2).map(lienReseau).join(sep)}</span>`);
  const lignesReseaux = paires.join(sep);
  const partage = `https://wa.me/?text=${encodeURIComponent(t.partageMessage)}`;
  return {
    subject: t.objet,
    html: documentEdition({
      objet: t.objet,
      apercu: t.apercu,
      folio: [t.folio, FOLIO_SITE],
      raison: t.raison,
      liens: [['nfireport.com', SITE_URL], ['Confidentialité', `${SITE_URL}/confidentialite`]],
      corps: rangee(
        titre(t.titre)
        + paraHtml('Bonjour,', { marge: '22px 0 0' })
        + para(t.inscrit)
        + para(t.suite)
        + para(t.contacts, { role: 'doux', taille: 14.5, hauteur: 23 })
        + blanc(30)
        + encart(
          `<p class="c-encre" style="margin:0;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:18px;line-height:24px;font-weight:700;color:#111111;">${soude(t.attenteTitre)}</p>`
          + para(whatsappUrl ? t.attenteAvecChaine : t.attente, { taille: 15, hauteur: 24, marge: '8px 0 0' })
          + (whatsappUrl ? blanc(18) + bouton(t.whatsapp, whatsappUrl) : '')
          + `<p style="margin:16px 0 0;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14.5px;line-height:22px;">${lignesReseaux}</p>`,
        )
        + para(t.partage, { marge: '28px 0 0' })
        + lienFleche(t.partageLien, partage)
        + signature(),
        42,
      ),
    }),
  };
}

// ─── Contact ─────────────────────────────────────────────────────────────────

export function contactConfirmationEmail(name: string): { subject: string; html: string } {
  const t = TEXTES.contact_confirmation;
  return {
    subject: t.objet,
    html: documentEdition({
      objet: t.objet,
      apercu: t.apercu,
      folio: [t.folio, FOLIO_SITE],
      raison: t.raison,
      corps: rangee(
        titre(t.titre)
        + bonjour(name)
        + para(t.recu)
        + para(t.complement)
        + blanc(28) + bouton(t.bouton, `${SITE_URL}/articles`)
        + signature(),
        42,
      ),
    }),
  };
}

export function contactNotificationEmail(name: string, email: string, subject: string, message: string): { subject: string; html: string } {
  const t = TEXTES.contact_notification;
  const mailto = `mailto:${encodeURIComponent(email).replace(/%40/g, '@')}?subject=${encodeURIComponent(`Re : ${subject}`)}`;
  return {
    subject: `Nouveau message de ${name} : ${subject}`,
    html: documentEdition({
      objet: `Nouveau message de ${name}`,
      apercu: t.apercu,
      folio: [t.folio, FOLIO_SITE],
      raison: t.raison,
      liens: [['nfireport.com', SITE_URL]],
      corps: rangee(
        titre(t.titre)
        + blanc(22)
        + fiche([
          ['Nom', esc(name)],
          ['Adresse', `<a href="mailto:${esc(email)}" class="c-encre" style="color:#111111;text-decoration:underline;">${esc(email)}</a>`],
          ['Sujet', soude(esc(subject), 20)],
        ])
        + blanc(24)
        + citation(message.split('\n').map((l) => soude(esc(l))).join('<br>'))
        + blanc(28) + bouton(t.bouton, mailto),
        42,
      ),
    }),
  };
}

// ─── Premium ─────────────────────────────────────────────────────────────────

export function paymentConfirmationEmail(name: string, tier: string, billingCycle: string, expiresAt: string): { subject: string; html: string } {
  void tier;
  const t = TEXTES.payment_confirmation;
  return {
    subject: t.objet,
    html: documentEdition({
      objet: t.objet,
      apercu: t.apercu,
      folio: [t.folio, FOLIO_SITE],
      raison: t.raison,
      corps: rangee(
        titre(t.titre)
        + bonjour(name)
        + para(t.valide)
        + blanc(22)
        + fiche([
          ['Formule', typo(`Premium, ${dureeFormule(billingCycle)}`)],
          ['Accès jusqu’au', typo(dateFr(expiresAt))],
        ])
        + para(t.acces, { marge: '22px 0 0' })
        + para(t.facture)
        + blanc(28) + bouton(t.bouton, `${SITE_URL}/compte`)
        + signature(),
        42,
      ),
    }),
  };
}

export function paymentRejectionEmail(name: string, reason?: string): { subject: string; html: string } {
  const t = TEXTES.payment_rejection;
  const motif = reason && reason.trim()
    ? blanc(22) + paraHtml(`<strong class="c-encre" style="font-weight:600;color:#111111;">Motif${NB}:</strong> ${soude(esc(reason.trim()))}`)
    : '';
  return {
    subject: t.objet,
    html: documentEdition({
      objet: t.objet,
      apercu: t.apercu,
      folio: [t.folio, FOLIO_SITE],
      raison: t.raison,
      corps: rangee(
        titre(t.titre)
        + bonjour(name)
        + para(t.echec)
        + motif
        + para(t.erreur, { marge: motif ? '22px 0 0' : '16px 0 0' })
        + blanc(28) + bouton(t.bouton, `${SITE_URL}/pricing`)
        + signature(),
        42,
      ),
    }),
  };
}

export function subscriptionExpirationWarningEmail(name: string, expiresAt: string): { subject: string; html: string } {
  const t = TEXTES.subscription_expiration_warning;
  return {
    subject: t.objet,
    html: documentEdition({
      objet: t.objet,
      apercu: t.apercu,
      folio: [t.folio, FOLIO_SITE],
      raison: t.raison,
      corps: rangee(
        titre(t.titre)
        + bonjour(name)
        + paraHtml(`${typo('Votre accès Premium prend fin le')}${NB}<strong class="c-encre" style="color:#111111;">${typo(dateFr(expiresAt))}</strong>.`)
        + para(t.apres)
        + para(t.renouveler)
        + blanc(28) + bouton(t.bouton, `${SITE_URL}/pricing`)
        + signature(),
        42,
      ),
    }),
  };
}

export function subscriptionExpiredEmail(name: string, expiresAt: string): { subject: string; html: string } {
  const t = TEXTES.subscription_expired;
  return {
    subject: t.objet,
    html: documentEdition({
      objet: t.objet,
      apercu: t.apercu,
      folio: [t.folio, FOLIO_SITE],
      raison: t.raison,
      corps: rangee(
        titre(t.titre)
        + bonjour(name)
        + paraHtml(`${typo('Votre accès Premium a pris fin le')}${NB}<strong class="c-encre" style="color:#111111;">${typo(dateFr(expiresAt))}</strong>.`)
        + para(t.gratuit)
        + para(t.renouveler)
        + blanc(28) + bouton(t.bouton, `${SITE_URL}/pricing`)
        + signature(),
        42,
      ),
    }),
  };
}

export function adminPremiumGrantedEmail(name: string, startDate: string, endDate: string): { subject: string; html: string } {
  const t = TEXTES.admin_premium_granted;
  return {
    subject: t.objet,
    html: documentEdition({
      objet: t.objet,
      apercu: t.apercu,
      folio: [t.folio, FOLIO_SITE],
      raison: t.raison,
      corps: rangee(
        titre(t.titre)
        + bonjour(name)
        + para(t.active)
        + blanc(22)
        + fiche([
          ['Début', typo(dateFr(startDate))],
          ['Fin', typo(dateFr(endDate))],
        ])
        + para(t.acces, { marge: '22px 0 0' })
        + blanc(28) + bouton(t.bouton, `${SITE_URL}/compte`)
        + signature(),
        42,
      ),
    }),
  };
}

// ─── Facture (reçu) ──────────────────────────────────────────────────────────

export function invoiceEmail({
  customerName,
  invoiceNumber,
  amountXof,
  paidAt,
  periodStart,
  periodEnd,
  downloadUrl,
}: {
  customerName: string;
  invoiceNumber: string;
  amountXof: number;
  paidAt: string;
  periodStart?: string;
  periodEnd?: string;
  downloadUrl: string;
}): { subject: string; html: string } {
  const t = TEXTES.invoice;
  const periode = periodStart && periodEnd ? typo(`du ${dateFr(periodStart)} au ${dateFr(periodEnd)}`) : '';
  const emetteur = NFI_GROUP_ISSUER;
  const capital = `${emetteur.capitalXof.toLocaleString('fr-FR').replace(/\s/g, NB)}${NB}FCFA`;
  return {
    subject: `Votre facture ${invoiceNumber}`,
    html: documentEdition({
      objet: `Votre facture ${invoiceNumber}`,
      apercu: t.apercu,
      folio: ['Reçu de paiement', invoiceNumber],
      recu: {
        lignes: [
          esc(emetteur.name),
          `${typo(`SARL au capital de ${capital}, RCCM`)} <span style="white-space:nowrap;">${esc(emetteur.rccm ?? '')}</span>, ${typo(`NIF ${emetteur.nif}`)}`,
          typo(`Siège : ${emetteur.address}, ${emetteur.city}, ${emetteur.country}`),
          `${typo('Tél.')} <span style="white-space:nowrap;">${esc(emetteur.phone ?? '')}</span>`,
          soude('Document généré électroniquement, valable sans signature manuscrite.', 38),
        ],
      },
      corps: rangee(
        titre(t.titre)
        + paraHtml(`Bonjour ${esc(customerName)},`, { marge: '22px 0 0' })
        + para(t.intro)
        + blanc(24)
        + fiche([
          ['Numéro', esc(invoiceNumber)],
          ['Date du paiement', typo(dateFr(paidAt))],
          ['Prestation', periode ? `${typo(t.prestation)}<br><span class="c-doux" style="font-weight:400;color:#6b6f76;">${periode}</span>` : typo(t.prestation)],
          ['Montant', `<span style="font-size:20px;line-height:26px;">${montantXof(amountXof)}</span>`],
          ['Statut', `<span style="color:#15803d;">${typo('Payé')}</span>`],
        ])
        + blanc(28) + bouton(t.bouton, downloadUrl)
        + lienFleche(t.toutes, `${SITE_URL}/compte/factures`, '16px 0 0')
        + para(t.conservation, { role: 'doux', taille: 13.5, hauteur: 21, marge: '24px 0 0' }),
        42,
      ),
    }),
  };
}

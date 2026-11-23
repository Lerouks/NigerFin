import type { TransactionalEmailKey } from '@/lib/emails/registry';
import { soude, titreTypo, typo } from '@/lib/emails/edition';
import { TEXTES } from '@/lib/emails/textes';

/**
 * Textes EDITABLES des e-mails transactionnels (objet + blocs de texte statiques).
 *
 * Chaque `default` est la chaine EXACTE telle qu'elle apparait dans le HTML rendu
 * par le template (src/lib/email-templates.ts). L'edition fonctionne par
 * remplacement de chaine : override.blocks[key] remplace `default` dans le HTML.
 * Les textes viennent de src/lib/emails/textes.ts et passent par la meme
 * typographie que les templates (soude pour un paragraphe, titreTypo pour un
 * titre ou un bouton, typo pour un lien) : ils ne peuvent pas diverger.
 * On n'expose QUE des textes statiques et sans balise interne.
 *
 * Un test (emails-slots.test.ts) verifie que chaque `default` est bien present
 * dans le HTML rendu : toute erreur de recopie est attrapee automatiquement.
 */

export interface EmailSlot {
  key: string;
  label: string;
  default: string;
}

export interface TemplateSlots {
  /** Objet editable. Absent = objet dynamique (facture, contact), non editable. */
  subject?: string;
  blocks: EmailSlot[];
}

const titreSlot = (d: string): EmailSlot => ({ key: 'heading', label: 'Titre', default: titreTypo(d) });
const boutonSlot = (d: string): EmailSlot => ({ key: 'bouton', label: 'Bouton', default: titreTypo(d) });
const bloc = (key: string, label: string, d: string): EmailSlot => ({ key, label, default: soude(d) });

const W = TEXTES.welcome_signup;
const N = TEXTES.newsletter_welcome;
const CC = TEXTES.contact_confirmation;
const PC = TEXTES.payment_confirmation;
const PR = TEXTES.payment_rejection;
const EW = TEXTES.subscription_expiration_warning;
const EX = TEXTES.subscription_expired;
const AG = TEXTES.admin_premium_granted;
const AD = TEXTES.admin_downgrade_to_free;
const PW = TEXTES.password_changed;
const IV = TEXTES.invoice;
const WA = TEXTES.waitlist_confirmation;

export const TEMPLATE_SLOTS: Record<TransactionalEmailKey, TemplateSlots> = {
  welcome_signup: {
    subject: W.objet,
    blocks: [
      titreSlot(W.titre),
      bloc('intro', 'Introduction', W.intro),
      { key: 'articles_titre', label: 'Rubrique 1 (titre)', default: titreTypo(W.articlesTitre) },
      bloc('articles', 'Rubrique 1 (texte)', W.articles),
      { key: 'simulateurs_titre', label: 'Rubrique 2 (titre)', default: titreTypo(W.simulateursTitre) },
      bloc('simulateurs', 'Rubrique 2 (texte)', W.simulateurs),
      { key: 'premium_titre', label: 'Rubrique 3 (titre)', default: titreTypo(W.premiumTitre) },
      bloc('premium', 'Rubrique 3 (texte)', W.premium),
      boutonSlot(W.bouton),
    ],
  },
  newsletter_welcome: {
    subject: N.objet,
    blocks: [
      titreSlot(N.titre),
      bloc('intro', 'Introduction', N.intro),
      bloc('articles', 'Derniers articles', N.articles),
      boutonSlot(N.bouton),
      { key: 'promo_titre', label: 'Encart Premium (titre)', default: titreTypo(N.premiumTitre) },
      bloc('promo_corps', 'Encart Premium (texte)', N.premium),
      { key: 'promo_cta', label: 'Encart Premium (lien)', default: typo(N.premiumLien) },
    ],
  },
  contact_confirmation: {
    subject: CC.objet,
    blocks: [
      titreSlot(CC.titre),
      bloc('recu', 'Accusé', CC.recu),
      bloc('complement', 'Compléter la demande', CC.complement),
      boutonSlot(CC.bouton),
    ],
  },
  payment_confirmation: {
    subject: PC.objet,
    blocks: [
      titreSlot(PC.titre),
      bloc('valide', 'Paiement validé', PC.valide),
      bloc('acces', 'Accès ouvert', PC.acces),
      bloc('facture', 'Facture', PC.facture),
      boutonSlot(PC.bouton),
    ],
  },
  payment_rejection: {
    subject: PR.objet,
    blocks: [
      titreSlot(PR.titre),
      bloc('echec', 'Échec', PR.echec),
      bloc('erreur', 'Erreur possible', PR.erreur),
      boutonSlot(PR.bouton),
    ],
  },
  subscription_expiration_warning: {
    subject: EW.objet,
    blocks: [
      titreSlot(EW.titre),
      bloc('apres', 'Après l’échéance', EW.apres),
      bloc('renouveler', 'Renouveler', EW.renouveler),
      boutonSlot(EW.bouton),
    ],
  },
  admin_premium_granted: {
    subject: AG.objet,
    blocks: [
      titreSlot(AG.titre),
      bloc('active', 'Activation', AG.active),
      bloc('acces', 'Accès ouvert', AG.acces),
      boutonSlot(AG.bouton),
    ],
  },
  admin_downgrade_to_free: {
    subject: AD.objet,
    blocks: [
      titreSlot(AD.titre),
      bloc('retire', 'Retrait', AD.retire),
      bloc('effet', 'Effet immédiat', AD.effet),
      bloc('retour', 'Retour au Premium', AD.retour),
      boutonSlot(AD.bouton),
    ],
  },
  password_changed: {
    subject: PW.objet,
    blocks: [
      titreSlot(PW.titre),
      bloc('modifie', 'Confirmation', PW.modifie),
      bloc('vous', 'C’était vous', PW.vous),
      bloc('pas_vous', 'Ce n’était pas vous', PW.pasVous),
      bloc('prevenir', 'Nous prévenir', PW.prevenir),
      boutonSlot(PW.bouton),
    ],
  },
  invoice: {
    // Objet dynamique (numéro de facture) : non editable.
    blocks: [
      titreSlot(IV.titre),
      bloc('intro', 'Introduction', IV.intro),
      boutonSlot(IV.bouton),
    ],
  },
  subscription_expired: {
    subject: EX.objet,
    blocks: [
      titreSlot(EX.titre),
      bloc('gratuit', 'Lecture gratuite', EX.gratuit),
      bloc('renouveler', 'Renouveler', EX.renouveler),
      boutonSlot(EX.bouton),
    ],
  },
  waitlist_confirmation: {
    subject: WA.objet,
    blocks: [
      titreSlot(WA.titre),
      bloc('inscrit', 'Inscription', WA.inscrit),
      bloc('suite', 'Ce qui va se passer', WA.suite),
      bloc('contacts', 'Ajouter aux contacts', WA.contacts),
      { key: 'attente_titre', label: 'Encadré (titre)', default: titreTypo(WA.attenteTitre) },
      bloc('attente', 'Encadré (texte)', WA.attente),
      bloc('partage', 'Partage', WA.partage),
      { key: 'partage_lien', label: 'Partage (lien)', default: typo(WA.partageLien) },
    ],
  },
  contact_notification: {
    // E-mail interne (équipe), objet dynamique : seul le titre est editable.
    blocks: [
      titreSlot(TEXTES.contact_notification.titre),
    ],
  },
};

import type { TransactionalEmailKey } from '@/lib/emails/registry';

/**
 * Textes EDITABLES des e-mails transactionnels (objet + blocs de texte statiques).
 *
 * Chaque `default` est la chaine EXACTE telle qu'elle apparait dans le HTML rendu
 * par le template (src/lib/email-templates.ts). L'edition fonctionne par
 * remplacement de chaine : override.blocks[key] remplace `default` dans le HTML.
 * On n'expose QUE des textes statiques et sans balise interne (les lignes
 * interpolees comme « Bonjour {name}, » ou contenant des liens ne sont pas
 * editables, pour garantir un remplacement fiable et ne jamais casser le design).
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

export const TEMPLATE_SLOTS: Record<TransactionalEmailKey, TemplateSlots> = {
  welcome_signup: {
    subject: 'Bienvenue sur NFI Report !',
    blocks: [
      { key: 'heading', label: 'Titre', default: 'Bienvenue sur NFI Report' },
      { key: 'compte_cree', label: 'Compte créé', default: "Votre compte a bien été créé. Vous avez désormais accès à nos articles, analyses économiques et outils financiers dédiés au Niger et à l'Afrique de l'Ouest." },
      { key: 'compte_gratuit', label: 'Compte gratuit', default: "Avec votre compte gratuit, vous pouvez lire jusqu'à 3 articles premium par mois, accéder aux outils de base et vous abonner à notre newsletter." },
      { key: 'bouton', label: 'Bouton', default: 'Découvrir les articles' },
      { key: 'premium', label: 'Appel Premium', default: 'Pour un accès illimité à tous nos contenus et outils premium, découvrez notre offre Premium.' },
    ],
  },
  newsletter_welcome: {
    subject: 'Bienvenue sur NFI Report',
    blocks: [
      { key: 'heading', label: 'Titre', default: 'Bienvenue sur NFI Report' },
      { key: 'intro', label: 'Introduction', default: "Vous êtes désormais inscrit. Vous recevrez nos briefings économiques sur le Niger et l'Afrique de l'Ouest : analyses, données de marché et décryptages." },
      { key: 'bouton', label: 'Bouton', default: 'Lire les derniers articles' },
      { key: 'promo_titre', label: 'Encart Premium (titre)', default: "Envie d'aller plus loin ?" },
      { key: 'promo_corps', label: 'Encart Premium (texte)', default: "Les abonnés Premium reçoivent 2 analyses exclusives par semaine, des alertes en temps réel et l'accès à tous nos outils financiers." },
      { key: 'promo_cta', label: 'Encart Premium (lien)', default: "Découvrir l'offre Premium →" },
    ],
  },
  contact_confirmation: {
    subject: 'Nous avons bien reçu votre message - NFI Report',
    blocks: [
      { key: 'heading', label: 'Titre', default: 'Message bien reçu' },
      { key: 'recu', label: 'Accusé', default: 'Nous avons bien reçu votre message et notre équipe vous répondra dans les plus brefs délais.' },
      { key: 'attente', label: 'En attendant', default: "En attendant, n'hésitez pas à consulter nos derniers articles et analyses." },
      { key: 'bouton', label: 'Bouton', default: 'Consulter le site' },
    ],
  },
  payment_confirmation: {
    subject: 'Votre abonnement Premium est activé - NFI Report',
    blocks: [
      { key: 'heading', label: 'Titre', default: 'Abonnement Premium activé' },
      { key: 'illimite', label: 'Accès illimité', default: "Vous avez désormais un accès illimité à tous les articles, analyses, outils premium et newsletters exclusives." },
      { key: 'bouton', label: 'Bouton', default: 'Accéder à votre compte' },
    ],
  },
  payment_rejection: {
    subject: 'Paiement non validé - NFI Report',
    blocks: [
      { key: 'heading', label: 'Titre', default: 'Paiement non validé' },
      { key: 'echec', label: 'Échec', default: "Nous n'avons pas pu valider votre paiement. Votre abonnement n'a pas été activé." },
      { key: 'erreur', label: 'Erreur possible', default: "Si vous pensez qu'il s'agit d'une erreur, vous pouvez soumettre une nouvelle demande ou nous contacter directement." },
      { key: 'bouton', label: 'Bouton', default: 'Réessayer le paiement' },
    ],
  },
  subscription_expiration_warning: {
    subject: 'Votre abonnement expire bientôt - NFI Report',
    blocks: [
      { key: 'heading', label: 'Titre', default: 'Votre abonnement expire bientôt' },
      { key: 'renouveler', label: 'Renouveler', default: 'Renouvelez dès maintenant pour continuer à bénéficier de tous les avantages Premium sans interruption.' },
      { key: 'bouton', label: 'Bouton', default: 'Renouveler mon abonnement' },
    ],
  },
  admin_premium_granted: {
    subject: 'Votre abonnement Premium NFI REPORT est activé',
    blocks: [
      { key: 'heading', label: 'Titre', default: 'Votre abonnement Premium est activé' },
      { key: 'illimite', label: 'Accès immédiat', default: "Vous avez désormais un accès immédiat et illimité à tous les contenus premium : articles, analyses, outils avancés et newsletters exclusives." },
      { key: 'bouton', label: 'Bouton', default: 'Accéder aux contenus Premium' },
    ],
  },
  admin_downgrade_to_free: {
    subject: 'Modification de votre abonnement NFI REPORT',
    blocks: [
      { key: 'heading', label: 'Titre', default: 'Modification de votre abonnement' },
      { key: 'effet', label: 'Effet immédiat', default: "Ce changement prend effet immédiatement. Vous conservez l'accès aux articles gratuits et à un nombre limité d'articles premium par mois." },
      { key: 'reabo', label: 'Réabonnement', default: "Pour retrouver un accès illimité à tous nos contenus et outils premium, vous pouvez vous réabonner à tout moment." },
      { key: 'bouton', label: 'Bouton', default: 'Voir les offres Premium' },
    ],
  },
  password_changed: {
    subject: 'Votre mot de passe NFI REPORT a été modifié',
    blocks: [
      { key: 'heading', label: 'Titre', default: 'Mot de passe modifié' },
      { key: 'succes', label: 'Confirmation', default: 'Votre mot de passe NFI Report a été modifié avec succès.' },
      { key: 'bouton', label: 'Bouton', default: 'Accéder à votre compte' },
    ],
  },
  invoice: {
    // Objet dynamique (numéro de facture) : non editable.
    blocks: [
      { key: 'heading', label: 'Titre', default: 'Votre facture est disponible' },
      { key: 'intro', label: 'Introduction', default: "Vous trouverez ci-joint au format PDF votre facture pour l'activation de votre abonnement Premium. Vous pouvez la télécharger ici, ou la retrouver à tout moment dans votre espace compte." },
      { key: 'bouton', label: 'Bouton', default: 'Télécharger la facture (PDF)' },
    ],
  },
  subscription_expired: {
    subject: 'Votre abonnement Premium NFI REPORT a expiré',
    blocks: [
      { key: 'heading', label: 'Titre', default: 'Votre abonnement Premium a expiré' },
      { key: 'acces', label: 'Perte d\'accès', default: "Vous n'avez plus accès aux articles premium, outils avancés et newsletters exclusives. Votre statut est désormais Lecteur gratuit." },
      { key: 'renouveler', label: 'Renouveler', default: "Renouvelez votre abonnement dès maintenant pour retrouver un accès illimité à tous nos contenus." },
      { key: 'bouton', label: 'Bouton', default: 'Renouveler mon abonnement' },
    ],
  },
  contact_notification: {
    // E-mail interne (équipe), objet dynamique : seul le titre est editable.
    blocks: [
      { key: 'heading', label: 'Titre', default: 'Nouveau message de contact' },
    ],
  },
};

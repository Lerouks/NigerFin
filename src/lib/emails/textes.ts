/**
 * Textes des e-mails transactionnels de NFI REPORT : source unique.
 *
 * Les gabarits (src/lib/email-templates.ts) et les blocs modifiables du Cockpit
 * (src/lib/emails/slots.ts) lisent ces mêmes phrases, passées par la même
 * typographie : un texte ne peut donc pas diverger entre l'envoi et l'édition.
 *
 * Règles de rédaction (Raouf, 22-23/11/2026) : phrases complètes, vouvoiement,
 * aucune promesse (ni délai de réponse, ni garantie, ni fonction qui n'existe
 * pas), NFI REPORT comme seul nom public, avantages Premium identiques à ceux de
 * la page des offres (PricingContent.tsx).
 */

const AVANTAGES_PREMIUM =
  'tous les contenus Premium : les cours d’éducation financière, le Brief du Lundi complet, les outils avancés et tous nos articles';

export const TEXTES = {
  welcome_signup: {
    objet: 'Bienvenue sur NFI REPORT',
    apercu: 'Votre compte est actif. Voici par où commencer.',
    folio: 'Votre compte',
    titre: 'Bienvenue sur NFI REPORT',
    intro: 'Votre compte est actif : il vous ouvre nos articles gratuits et trois articles Premium par mois.',
    articlesTitre: 'Les articles',
    articles: 'Ils expliquent l’économie du Niger.',
    articlesLien: 'Lire les articles',
    simulateursTitre: 'Les simulateurs',
    simulateurs: 'Ils calculent vos emprunts et vos placements.',
    simulateursLien: 'Ouvrir les simulateurs',
    premiumTitre: 'L’offre Premium',
    premium: 'Elle ouvre tous les contenus Premium : articles, Brief du Lundi complet, outils avancés et cours.',
    premiumLien: 'Découvrir l’offre Premium',
    bouton: 'Lire les derniers articles',
    salut: 'Bonne lecture,',
    raison: 'Vous recevez ce message parce que vous venez de créer un compte sur nfireport.com.',
  },
  newsletter_welcome: {
    objet: 'Bienvenue dans la newsletter de NFI REPORT',
    apercu: 'Votre inscription est confirmée.',
    folio: 'Newsletter',
    titre: 'Merci pour votre inscription',
    intro: 'Votre adresse est bien inscrite à la newsletter de NFI REPORT, consacrée à l’économie et à la finance du Niger.',
    articles: 'Nos derniers articles sont déjà en ligne, si vous voulez commencer tout de suite.',
    bouton: 'Lire les derniers articles',
    premiumTitre: 'Le Brief du Lundi en intégralité',
    premium: 'Les lecteurs Premium reçoivent le Brief du Lundi en intégralité, et accèdent aussi à tous nos articles, outils et cours Premium.',
    premiumLien: 'Découvrir l’offre Premium',
    raison: 'Vous recevez ce message parce que cette adresse vient d’être inscrite à la newsletter de NFI REPORT.',
    desabonner: 'Se désabonner de la newsletter',
  },
  contact_confirmation: {
    objet: 'Nous avons bien reçu votre message',
    apercu: 'Votre message est bien arrivé à l’équipe de NFI REPORT.',
    folio: 'Contact',
    titre: 'Message bien reçu',
    recu: 'Merci de nous avoir écrit. Votre message est bien arrivé à l’équipe de NFI REPORT.',
    complement: 'Pour ajouter une précision à votre demande, répondez simplement à ce message.',
    bouton: 'Lire nos derniers articles',
    raison: 'Vous recevez ce message parce que vous avez écrit à NFI REPORT depuis le formulaire de contact du site.',
  },
  contact_notification: {
    apercu: 'Un visiteur a écrit depuis le formulaire de contact du site.',
    folio: 'Contact, message reçu',
    titre: 'Nouveau message de contact',
    bouton: 'Répondre',
    raison: 'Message reçu par le formulaire de contact de nfireport.com.',
  },
  payment_confirmation: {
    objet: 'Votre accès Premium est activé',
    apercu: 'Votre paiement est validé. Bonne lecture.',
    folio: 'Premium',
    titre: 'Votre accès Premium est activé',
    valide: 'Votre paiement est validé, merci pour votre confiance.',
    acces: `Vous avez maintenant accès à ${AVANTAGES_PREMIUM}.`,
    facture: 'Votre facture vous attend dans votre compte, à la rubrique Factures.',
    bouton: 'Accéder à mon compte',
    raison: 'Vous recevez ce message parce qu’un paiement Premium vient d’être validé sur votre compte NFI REPORT.',
  },
  payment_rejection: {
    objet: 'Votre paiement n’a pas pu être validé',
    apercu: 'Votre accès Premium n’a pas été activé.',
    folio: 'Premium',
    titre: 'Paiement non validé',
    echec: 'Nous n’avons pas pu valider votre paiement, et votre accès Premium n’a donc pas été activé.',
    erreur: 'Si vous pensez qu’il s’agit d’une erreur, vous pouvez refaire une demande, ou répondre à ce message pour nous expliquer ce qui s’est passé.',
    bouton: 'Refaire une demande',
    raison: 'Vous recevez ce message parce qu’une demande de paiement a été faite depuis votre compte NFI REPORT.',
  },
  subscription_expiration_warning: {
    objet: 'Votre accès Premium prend fin dans quelques jours',
    apercu: 'Renouvelez-le pour continuer sans interruption.',
    folio: 'Premium',
    titre: 'Votre accès Premium prend fin bientôt',
    apres: 'Après cette date, votre compte reviendra en lecture gratuite.',
    renouveler: 'Pour continuer sans interruption, il suffit de renouveler votre accès, pour la durée de votre choix.',
    bouton: 'Renouveler mon accès',
    raison: 'Vous recevez ce message parce que votre accès Premium arrive à échéance.',
  },
  subscription_expired: {
    objet: 'Votre accès Premium a pris fin',
    apercu: 'Votre compte est revenu en lecture gratuite.',
    folio: 'Premium',
    titre: 'Votre accès Premium a pris fin',
    gratuit: 'Votre compte est revenu en lecture gratuite, avec nos articles gratuits et trois articles Premium par mois.',
    renouveler: 'Vous pouvez renouveler votre accès Premium quand vous le souhaitez.',
    bouton: 'Renouveler mon accès',
    raison: 'Vous recevez ce message parce que votre accès Premium est arrivé à échéance.',
  },
  admin_premium_granted: {
    objet: 'Votre accès Premium est ouvert',
    apercu: 'L’équipe de NFI REPORT vient de l’activer.',
    folio: 'Premium',
    titre: 'Votre accès Premium est ouvert',
    active: 'L’équipe de NFI REPORT vient d’activer votre accès Premium.',
    acces: `Vous avez maintenant accès à ${AVANTAGES_PREMIUM}.`,
    bouton: 'Accéder à mon compte',
    raison: 'Vous recevez ce message parce qu’un accès Premium vient d’être ouvert sur votre compte.',
  },
  admin_downgrade_to_free: {
    objet: 'Votre compte est passé en lecture gratuite',
    apercu: 'Votre accès Premium a été retiré.',
    folio: 'Votre compte',
    titre: 'Votre compte est passé en lecture gratuite',
    retire: 'Votre compte passe en lecture gratuite : votre accès Premium a été retiré.',
    effet: 'Le changement est immédiat. Vous gardez nos articles gratuits et trois articles Premium par mois.',
    retour: 'Vous pouvez retrouver l’accès Premium à tout moment depuis la page des offres.',
    bouton: 'Voir les offres',
    raison: 'Vous recevez ce message parce que le statut de votre compte NFI REPORT a changé.',
  },
  password_changed: {
    objet: 'Votre mot de passe a été modifié',
    apercu: 'Si c’était bien vous, vous n’avez rien à faire.',
    folio: 'Votre compte',
    titre: 'Mot de passe modifié',
    modifie: 'Le mot de passe de votre compte NFI REPORT vient d’être modifié.',
    vous: 'Si c’était bien vous, vous n’avez rien à faire.',
    pasVous: 'Si ce n’est pas vous, cliquez tout de suite sur “Mot de passe oublié” dans la page de connexion pour en choisir un nouveau.',
    prevenir: 'Prévenez-nous ensuite en répondant à ce message.',
    bouton: 'Ouvrir la page de connexion',
    raison: 'Vous recevez ce message parce que votre mot de passe NFI REPORT a été modifié.',
  },
  waitlist_confirmation: {
    objet: 'C’est noté : nous vous préviendrons de l’ouverture',
    apercu: 'Votre adresse est bien inscrite sur la liste d’attente de NFI REPORT.',
    folio: 'Liste d’attente',
    titre: 'C’est noté',
    inscrit: 'Votre adresse est bien inscrite sur la liste d’attente de NFI REPORT, le média de l’économie et de la finance du Niger.',
    suite: 'Nous vous écrirons à l’approche de l’ouverture du site, puis le jour même, et votre adresse ne sert qu’à cela.',
    contacts: 'Pour que nos messages ne se perdent pas dans les indésirables, ajoutez notre adresse à vos contacts.',
    attenteTitre: 'En attendant l’ouverture',
    attente: 'Suivez l’actualité économique du Niger sur nos réseaux.',
    attenteAvecChaine: 'Suivez l’actualité économique du Niger sur notre chaîne WhatsApp et sur nos réseaux.',
    whatsapp: 'Rejoindre la chaîne WhatsApp',
    partage: 'Si un proche s’intéresse à l’économie du Niger, vous pouvez lui envoyer la page d’attente.',
    partageLien: 'Partager sur WhatsApp',
    partageMessage: 'NFI REPORT, le média de l’économie et de la finance du Niger, ouvre bientôt son site. Inscrivez-vous pour être prévenu : https://nfireport.com',
    raison: 'Vous recevez ce message parce que cette adresse vient d’être inscrite sur la liste d’attente de NFI REPORT.',
    retirer: 'Quitter la liste d’attente',
  },
  invoice: {
    apercu: 'Votre facture est jointe à ce message.',
    titre: 'Votre facture est disponible',
    intro: 'Merci pour votre paiement : votre facture est jointe à ce message au format PDF, et elle reste disponible dans votre compte.',
    prestation: 'Accès Premium',
    bouton: 'Télécharger la facture',
    toutes: 'Voir toutes mes factures',
    conservation: 'Cette facture est un document comptable : conservez-la avec vos pièces.',
  },
} as const;

/** Durée lisible d'une formule Premium (1 mois, 3 mois, 6 mois, 1 an). */
export function dureeFormule(cycle: string): string {
  switch (cycle) {
    case 'quarterly': return '3 mois';
    case 'semi_annual': return '6 mois';
    case 'annual': return '1 an';
    default: return '1 mois';
  }
}

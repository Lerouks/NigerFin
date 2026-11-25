/**
 * Le libellé et la couleur de chaque action du journal du cockpit. Une action
 * sans libellé s'affiche sous son nom technique (« email.transactional_edit ») :
 * le test libelles-du-journal vérifie que chaque action écrite par le code a
 * la sienne.
 */

export interface ActionDuJournal {
  libelle: string;
  couleur: string;
}

const ROUGE = 'bg-red-100 text-red-700';
const VERT = 'bg-emerald-100 text-emerald-700';
const BLEU = 'bg-blue-100 text-blue-700';
const GRIS = 'bg-gray-100 text-gray-700';
const ORANGE = 'bg-orange-100 text-orange-700';
const VIOLET = 'bg-purple-100 text-purple-700';
const AMBRE = 'bg-amber-100 text-amber-700';

export const ACTIONS_DU_JOURNAL: Readonly<Record<string, ActionDuJournal>> = {
  // Paiements et prix
  verify_payment: { libelle: 'Paiement validé', couleur: VERT },
  reject_payment: { libelle: 'Paiement rejeté', couleur: ROUGE },
  ipaymoney_payment_verified: { libelle: 'Paiement iPayMoney validé', couleur: VERT },
  ipaymoney_payment_failed: { libelle: 'Paiement iPayMoney refusé', couleur: ROUGE },
  update_price: { libelle: 'Prix modifié', couleur: AMBRE },
  // Abonnements
  activate_subscription: { libelle: 'Abonnement activé', couleur: VIOLET },
  deactivate_subscription: { libelle: 'Abonnement désactivé', couleur: GRIS },
  subscription_expired: { libelle: 'Abonnement expiré', couleur: ORANGE },
  // Comptes
  change_role: { libelle: 'Rôle modifié', couleur: BLEU },
  block_user: { libelle: 'Utilisateur bloqué', couleur: ROUGE },
  unblock_user: { libelle: 'Utilisateur débloqué', couleur: VERT },
  delete_user: { libelle: 'Utilisateur supprimé', couleur: ROUGE },
  password_created: { libelle: 'Mot de passe créé', couleur: VERT },
  password_changed: { libelle: 'Mot de passe changé', couleur: VERT },
  password_create_failed: { libelle: 'Mot de passe non créé', couleur: ROUGE },
  password_change_failed: { libelle: 'Mot de passe non changé', couleur: ROUGE },
  password_change_wrong_current: { libelle: 'Ancien mot de passe faux', couleur: ORANGE },
  password_change_rate_limited: { libelle: 'Trop d’essais de mot de passe', couleur: ORANGE },
  // Messages et commentaires
  update_message_status: { libelle: 'Statut du message modifié', couleur: GRIS },
  delete_message: { libelle: 'Message supprimé', couleur: ROUGE },
  delete_comment: { libelle: 'Commentaire supprimé', couleur: ROUGE },
  // Mails et newsletter
  'email.transactional_edit': { libelle: 'Mail automatique modifié', couleur: AMBRE },
  'email.transactional_test': { libelle: 'Mail d’essai envoyé', couleur: BLEU },
  'email.transactional_resend': { libelle: 'Mail renvoyé', couleur: BLEU },
  'newsletter.send': { libelle: 'Newsletter envoyée', couleur: BLEU },
  'newsletter.test': { libelle: 'Newsletter d’essai envoyée', couleur: BLEU },
  'newsletter.unsubscribe': { libelle: 'Abonné désinscrit', couleur: GRIS },
  // Exports et corbeille
  export_csv: { libelle: 'Export CSV', couleur: BLEU },
  export_xlsx: { libelle: 'Export Excel', couleur: BLEU },
  'corbeille.mise': { libelle: 'Mis à la corbeille', couleur: GRIS },
  'corbeille.restauration': { libelle: 'Restauré', couleur: VERT },
  'corbeille.suppression_definitive': { libelle: 'Supprimé définitivement', couleur: ROUGE },
};

/** Libellé et couleur d'une action ; une action inconnue garde son nom technique. */
export function actionDuJournal(action: string): ActionDuJournal {
  return ACTIONS_DU_JOURNAL[action] ?? { libelle: action, couleur: 'bg-gray-100 text-gray-600' };
}

/**
 * Le nom en français de ce sur quoi porte une action (colonne « Type »). Les
 * tables de la corbeille y sont toutes : le test libelles-du-journal le vérifie.
 */
export const TYPES_DU_JOURNAL: Readonly<Record<string, string>> = {
  user: 'Compte',
  users: 'Comptes',
  payment: 'Paiement',
  payment_request: 'Paiement',
  payments: 'Paiements',
  pricing: 'Tarifs',
  email: 'Mail',
  newsletter: 'Newsletter',
  newsletter_subscribers: 'Abonnés newsletter',
  subscribers: 'Abonnés newsletter',
  newsletter_issues: 'Numéro de newsletter',
  message: 'Message',
  messages: 'Messages',
  comment: 'Commentaire',
  stats: 'Statistiques',
  cron: 'Tâche planifiée',
  article: 'Article',
  articles: 'Article',
  education: 'Apprendre',
  education_lessons: 'Leçon',
  education_categories: 'Catégorie d’Apprendre',
  enterprise: 'Fiche entreprise',
  strategic_enterprises: 'Fiche entreprise',
  legal_sections: 'Page légale',
  market_data: 'Donnée de marché',
  niger_presentation: 'Page Niger',
  site_features: 'Visibilité du site',
  flash_banner: 'Flash info',
};

/** Le nom en français d'un type ; un type inconnu garde son nom technique. */
export function typeDuJournal(type: string): string {
  return TYPES_DU_JOURNAL[type] ?? type;
}

/**
 * Ajoute une page plus ancienne du journal à ce qui est déjà affiché. Si des
 * actions sont arrivées entre-temps, les pages ont glissé d'autant : une ligne
 * déjà affichée peut revenir, et elle n'est gardée qu'une fois.
 */
export function ajouterLaSuite<T extends { id: string }>(affichees: readonly T[], suite: readonly T[]): T[] {
  const vues = new Set(affichees.map((ligne) => ligne.id));
  return [...affichees, ...suite.filter((ligne) => !vues.has(ligne.id))];
}

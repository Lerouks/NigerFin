import type { SupabaseClient } from '@supabase/supabase-js';
import * as T from '@/lib/email-templates';

/**
 * Registre unique des e-mails transactionnels de NFI Report.
 *
 * Source de verite pour le centre de commandement email du Cockpit :
 * metadonnees (libelle, declencheur, layout), rendu HTML a partir de donnees
 * d'exemple OU reelles, et resolution best-effort des vraies donnees d'un
 * destinataire. Toutes les fonctions de rendu delegue aux templates existants
 * de `src/lib/email-templates.ts` : aucune duplication, aucune divergence.
 */

export type TransactionalEmailKey =
  | 'welcome_signup'
  | 'newsletter_welcome'
  | 'contact_confirmation'
  | 'payment_confirmation'
  | 'payment_rejection'
  | 'subscription_expiration_warning'
  | 'admin_premium_granted'
  | 'admin_downgrade_to_free'
  | 'password_changed'
  | 'invoice'
  | 'subscription_expired'
  | 'contact_notification';

/** Arguments d'un template : valeurs scalaires simples, jamais de HTML de mise en page. */
export type TransactionalArgs = Record<string, string | number | undefined>;

export interface TransactionalEmailDef {
  key: TransactionalEmailKey;
  /** Libelle humain affiche dans le Cockpit. */
  label: string;
  /** `client` = envoye a un abonne ; `internal` = envoye a l'equipe NFI. */
  audience: 'client' | 'internal';
  /** `brand` = emailLayout (liseré or + slogan) ; `receipt` = receiptLayout (facture sobre). */
  layout: 'brand' | 'receipt';
  /** Quand cet e-mail part automatiquement. */
  triggerDescription: string;
  /** Champs editables (objet + textes), pour information cote UI. */
  variables: string[];
  /** Donnees d'exemple (aperçu par defaut, faux client « Amadou »). */
  sampleArgs: TransactionalArgs;
  /** Rend { subject, html } pour un jeu d'arguments donne. */
  render: (args: TransactionalArgs) => { subject: string; html: string };
  /** Resout best-effort de vraies donnees a partir d'un userId (complete l'exemple). */
  resolveRealArgs?: (client: SupabaseClient, userId: string) => Promise<TransactionalArgs>;
}

// ─── Donnees d'exemple deterministes (aucune fuite de donnees reelles) ───
const SAMPLE_NAME = 'Amadou Diallo';
const SAMPLE_EMAIL = 'amadou.diallo@example.com';
const SAMPLE_NOW = '2026-01-12T09:00:00.000Z';
const SAMPLE_FUTURE = '2027-01-12T09:00:00.000Z';
const SAMPLE_PAST = '2025-12-15T09:00:00.000Z';

// Lecteurs surs (fallback vers l'exemple si l'argument est absent ou du mauvais type).
const str = (v: unknown, fallback: string): string =>
  typeof v === 'string' && v.trim() ? v : fallback;
const num = (v: unknown, fallback: number): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback;

/**
 * Resout le nom d'affichage d'un destinataire depuis user_profiles.
 * Best-effort : renvoie {} en cas d'echec pour retomber sur l'exemple.
 */
async function resolveUserName(
  client: SupabaseClient,
  userId: string,
): Promise<TransactionalArgs> {
  try {
    const { data } = await client
      .from('user_profiles')
      .select('full_name')
      .eq('id', userId)
      .maybeSingle();
    const fullName = (data as { full_name?: string } | null)?.full_name;
    return fullName ? { name: fullName } : {};
  } catch {
    return {};
  }
}

export const TRANSACTIONAL_REGISTRY: Record<TransactionalEmailKey, TransactionalEmailDef> = {
  welcome_signup: {
    key: 'welcome_signup',
    label: 'Bienvenue (création de compte)',
    audience: 'client',
    layout: 'brand',
    triggerDescription: "À la première connexion, une seule fois (garde welcome_email_sent).",
    variables: ['name'],
    sampleArgs: { name: SAMPLE_NAME },
    render: (a) => T.welcomeSignupEmail(str(a.name, SAMPLE_NAME)),
    resolveRealArgs: resolveUserName,
  },
  newsletter_welcome: {
    key: 'newsletter_welcome',
    label: 'Bienvenue newsletter',
    audience: 'client',
    layout: 'brand',
    triggerDescription: "À l'inscription à la newsletter (nouvel abonné ou réactivation).",
    variables: [],
    sampleArgs: {},
    render: () => T.newsletterWelcomeEmail(),
  },
  contact_confirmation: {
    key: 'contact_confirmation',
    label: 'Accusé de réception (contact)',
    audience: 'client',
    layout: 'brand',
    triggerDescription: "Quand un visiteur envoie le formulaire de contact.",
    variables: ['name'],
    sampleArgs: { name: SAMPLE_NAME },
    render: (a) => T.contactConfirmationEmail(str(a.name, SAMPLE_NAME)),
    resolveRealArgs: resolveUserName,
  },
  payment_confirmation: {
    key: 'payment_confirmation',
    label: 'Abonnement Premium activé (paiement)',
    audience: 'client',
    layout: 'brand',
    triggerDescription: "Après validation d'un paiement (admin ou callback iPay).",
    variables: ['name', 'tier', 'billingCycle', 'expiresAt'],
    sampleArgs: { name: SAMPLE_NAME, tier: 'premium', billingCycle: 'annual', expiresAt: SAMPLE_FUTURE },
    render: (a) =>
      T.paymentConfirmationEmail(
        str(a.name, SAMPLE_NAME),
        str(a.tier, 'premium'),
        str(a.billingCycle, 'annual'),
        str(a.expiresAt, SAMPLE_FUTURE),
      ),
    resolveRealArgs: resolveUserName,
  },
  payment_rejection: {
    key: 'payment_rejection',
    label: 'Paiement non validé',
    audience: 'client',
    layout: 'brand',
    triggerDescription: "Quand un admin rejette une demande de paiement.",
    variables: ['name', 'reason'],
    sampleArgs: {
      name: SAMPLE_NAME,
      reason: "Le numéro de transaction fourni est introuvable côté iPayMoney.",
    },
    render: (a) =>
      T.paymentRejectionEmail(str(a.name, SAMPLE_NAME), str(a.reason, '') || undefined),
    resolveRealArgs: resolveUserName,
  },
  subscription_expiration_warning: {
    key: 'subscription_expiration_warning',
    label: 'Rappel : abonnement expire bientôt',
    audience: 'client',
    layout: 'brand',
    triggerDescription: "CRON quotidien 8h, 7 jours avant l'expiration.",
    variables: ['name', 'expiresAt'],
    sampleArgs: { name: SAMPLE_NAME, expiresAt: SAMPLE_FUTURE },
    render: (a) =>
      T.subscriptionExpirationWarningEmail(str(a.name, SAMPLE_NAME), str(a.expiresAt, SAMPLE_FUTURE)),
    resolveRealArgs: resolveUserName,
  },
  admin_premium_granted: {
    key: 'admin_premium_granted',
    label: 'Premium accordé (par un admin)',
    audience: 'client',
    layout: 'brand',
    triggerDescription: "Quand un admin active manuellement un abonnement.",
    variables: ['name', 'startDate', 'endDate'],
    sampleArgs: { name: SAMPLE_NAME, startDate: SAMPLE_NOW, endDate: SAMPLE_FUTURE },
    render: (a) =>
      T.adminPremiumGrantedEmail(
        str(a.name, SAMPLE_NAME),
        str(a.startDate, SAMPLE_NOW),
        str(a.endDate, SAMPLE_FUTURE),
      ),
    resolveRealArgs: resolveUserName,
  },
  admin_downgrade_to_free: {
    key: 'admin_downgrade_to_free',
    label: 'Passage en Lecteur gratuit',
    audience: 'client',
    layout: 'brand',
    triggerDescription: "Quand un admin désactive manuellement un abonnement.",
    variables: ['name'],
    sampleArgs: { name: SAMPLE_NAME },
    render: (a) => T.adminDowngradeToFreeEmail(str(a.name, SAMPLE_NAME)),
    resolveRealArgs: resolveUserName,
  },
  password_changed: {
    key: 'password_changed',
    label: 'Mot de passe modifié',
    audience: 'client',
    layout: 'brand',
    triggerDescription: "Après un changement de mot de passe réussi.",
    variables: ['name'],
    sampleArgs: { name: SAMPLE_NAME },
    render: (a) => T.passwordChangedEmail(str(a.name, SAMPLE_NAME)),
    resolveRealArgs: resolveUserName,
  },
  invoice: {
    key: 'invoice',
    label: 'Facture (reçu de paiement)',
    audience: 'client',
    layout: 'receipt',
    triggerDescription: "À l'émission d'une facture (PDF joint).",
    variables: ['customerName', 'invoiceNumber', 'amountXof', 'paidAt', 'periodStart', 'periodEnd', 'downloadUrl'],
    sampleArgs: {
      customerName: SAMPLE_NAME,
      invoiceNumber: 'FAC-2026-0001',
      amountXof: 50000,
      paidAt: SAMPLE_NOW,
      periodStart: SAMPLE_NOW,
      periodEnd: SAMPLE_FUTURE,
      downloadUrl: '#',
    },
    render: (a) =>
      T.invoiceEmail({
        customerName: str(a.customerName, SAMPLE_NAME),
        invoiceNumber: str(a.invoiceNumber, 'FAC-2026-0001'),
        amountXof: num(a.amountXof, 50000),
        paidAt: str(a.paidAt, SAMPLE_NOW),
        periodStart: str(a.periodStart, SAMPLE_NOW),
        periodEnd: str(a.periodEnd, SAMPLE_FUTURE),
        downloadUrl: str(a.downloadUrl, '#'),
      }),
  },
  subscription_expired: {
    key: 'subscription_expired',
    label: 'Abonnement Premium expiré',
    audience: 'client',
    layout: 'brand',
    triggerDescription: "CRON quotidien 2h, le jour de l'expiration.",
    variables: ['name', 'expiresAt'],
    sampleArgs: { name: SAMPLE_NAME, expiresAt: SAMPLE_PAST },
    render: (a) =>
      T.subscriptionExpiredEmail(str(a.name, SAMPLE_NAME), str(a.expiresAt, SAMPLE_PAST)),
    resolveRealArgs: resolveUserName,
  },
  contact_notification: {
    key: 'contact_notification',
    label: 'Notification interne (nouveau contact)',
    audience: 'internal',
    layout: 'brand',
    triggerDescription: "Envoyé à l'équipe NFI quand un visiteur écrit.",
    variables: ['name', 'email', 'subject', 'message'],
    sampleArgs: {
      name: SAMPLE_NAME,
      email: SAMPLE_EMAIL,
      subject: 'Question sur les tarifs Premium',
      message: "Bonjour, je souhaite savoir si l'abonnement annuel est facturable au nom de mon entreprise.",
    },
    render: (a) =>
      T.contactNotificationEmail(
        str(a.name, SAMPLE_NAME),
        str(a.email, SAMPLE_EMAIL),
        str(a.subject, 'Question'),
        str(a.message, ''),
      ),
  },
};

export function isTransactionalKey(value: unknown): value is TransactionalEmailKey {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(TRANSACTIONAL_REGISTRY, value);
}

export function getTransactionalDef(key: string): TransactionalEmailDef | null {
  return isTransactionalKey(key) ? TRANSACTIONAL_REGISTRY[key] : null;
}

/** Liste legere pour le Cockpit (sans les fonctions ni les donnees d'exemple lourdes). */
export function listTransactionalDefs(): Array<{
  key: TransactionalEmailKey;
  label: string;
  audience: 'client' | 'internal';
  layout: 'brand' | 'receipt';
  triggerDescription: string;
  subject: string;
  variables: string[];
}> {
  return (Object.keys(TRANSACTIONAL_REGISTRY) as TransactionalEmailKey[]).map((key) => {
    const def = TRANSACTIONAL_REGISTRY[key];
    return {
      key: def.key,
      label: def.label,
      audience: def.audience,
      layout: def.layout,
      triggerDescription: def.triggerDescription,
      subject: def.render(def.sampleArgs).subject,
      variables: def.variables,
    };
  });
}

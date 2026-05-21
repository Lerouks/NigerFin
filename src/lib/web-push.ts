/**
 * Helpers serveur pour le système Web Push du Cockpit admin.
 *
 * Le standard VAPID (Voluntary Application Server Identification) authentifie
 * notre serveur auprès des push services (FCM, Mozilla, Apple Push, etc.)
 * via une paire de clés ECDSA et un sujet (mailto:).
 *
 * Configuration : générer les clés avec `node scripts/generate-vapid-keys.mjs`
 * puis renseigner VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY et VAPID_SUBJECT en env.
 */

import webpush, { type WebPushError } from 'web-push';

export interface VapidConfig {
  publicKey: string;
  privateKey: string;
  subject: string;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

export interface PushSubscriptionRecord {
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
}

/**
 * Lit la configuration VAPID depuis les variables d'environnement.
 * Retourne null si la clé publique ou privée n'est pas configurée.
 */
export function getVapidConfig(): VapidConfig | null {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:contact@nfireport.com';
  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey, subject };
}

/**
 * Initialise le module web-push avec les détails VAPID.
 * Retourne false si la configuration n'est pas disponible.
 */
export function configureWebPush(): boolean {
  const config = getVapidConfig();
  if (!config) return false;
  webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
  return true;
}

/**
 * Envoie un push à une subscription donnée.
 * Peut lever une WebPushError (statusCode 410 si la subscription est expirée,
 * 404 si invalide, etc.). À l'appelant de gérer les erreurs et de purger
 * les abonnements expirés.
 */
export async function sendPushTo(
  subscription: PushSubscriptionRecord,
  payload: PushPayload,
): Promise<void> {
  if (!configureWebPush()) {
    throw new Error('VAPID non configuré');
  }
  await webpush.sendNotification(
    {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh_key,
        auth: subscription.auth_key,
      },
    },
    JSON.stringify(payload),
  );
}

/**
 * Type guard pour détecter les WebPushError du module web-push.
 * Utile pour traiter les codes 404 et 410 (subscription à supprimer).
 */
export function isWebPushError(error: unknown): error is WebPushError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    typeof (error as { statusCode: unknown }).statusCode === 'number'
  );
}

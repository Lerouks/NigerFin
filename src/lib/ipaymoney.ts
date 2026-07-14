import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';

/**
 * iPayMoney / iFutur — helpers serveur (vérification de paiement).
 *
 * Deux environnements, pilotés par NEXT_PUBLIC_IPAYMONEY_ENV :
 *  - "sandbox" : tests, aucun argent réel (défaut).
 *  - "live"    : production (nécessite le KYC iPay validé).
 *
 * L'API serveur iPay (base https://i-pay.money/api/v1) permet de VÉRIFIER
 * qu'un paiement a réellement abouti avant d'activer un abonnement. C'est la
 * garantie de sécurité centrale : même si un attaquant forge un appel de webhook,
 * la vérification serveur-à-serveur (avec la clé secrète) échouera tant qu'iPay
 * n'a pas réellement encaissé le paiement.
 */

export type IPayEnvironment = 'sandbox' | 'live';
export type IPayPaymentType = 'mobile' | 'card';

export const IPAYMONEY_API_BASE = 'https://i-pay.money/api/v1';

/**
 * Délai max (ms) d'un appel de vérification vers iPay. Au-delà, on renonce
 * proprement (null = « impossible de confirmer ») plutôt que de laisser la
 * fonction serverless Vercel expirer en 504 (ce qui déclencherait des retries
 * agressifs d'iPay et un risque de double traitement).
 */
const IPAY_VERIFY_TIMEOUT_MS = 8_000;

/** Environnement actif ('live' uniquement si explicitement configuré). */
export function getIPayEnvironment(): IPayEnvironment {
  return process.env.NEXT_PUBLIC_IPAYMONEY_ENV === 'live' ? 'live' : 'sandbox';
}

/** Réponse de l'endpoint GET /payments/{reference}, validée à la frontière (Zod). */
const ipayPaymentStatusSchema = z.object({
  external_reference: z.string().optional(),
  reference: z.string().optional(),
  status: z.string().optional(),
  msisdn: z.string().optional(),
});
export type IPayPaymentStatus = z.infer<typeof ipayPaymentStatusSchema>;

/** Statuts iPay considérés comme un paiement réellement réussi. */
export function isIPaySucceeded(status: string | undefined | null): boolean {
  return status === 'succeeded' || status === 'success' || status === 'completed';
}

/** Statuts iPay considérés comme un échec définitif. */
export function isIPayFailed(status: string | undefined | null): boolean {
  return (
    status === 'failed' ||
    status === 'cancelled' ||
    status === 'canceled' ||
    status === 'declined' ||
    status === 'error'
  );
}

/**
 * Interroge iPay pour connaître le statut réel d'un paiement, pour un type donné.
 * GET https://i-pay.money/api/v1/payments/{reference}
 *
 * Retourne null si l'appel n'aboutit pas (clé absente, réseau, timeout, 4xx/5xx,
 * JSON au format inattendu). Un null signifie « impossible de confirmer » et NE
 * DOIT JAMAIS être interprété comme un succès par l'appelant.
 */
async function fetchIPayPaymentStatus(
  reference: string,
  paymentType: IPayPaymentType,
): Promise<IPayPaymentStatus | null> {
  const secretKey = process.env.IPAYMONEY_SECRET_KEY;
  if (!secretKey) {
    Sentry.captureMessage(
      'IPAYMONEY_SECRET_KEY manquante — vérification serveur du paiement impossible',
      { level: 'error' },
    );
    return null;
  }
  if (!reference) return null;

  const env = getIPayEnvironment();

  try {
    const res = await fetch(
      `${IPAYMONEY_API_BASE}/payments/${encodeURIComponent(reference)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${secretKey}`,
          'Ipay-Payment-Type': paymentType,
          'Ipay-Target-Environment': env,
        },
        // Un statut de paiement ne doit jamais être servi depuis un cache.
        cache: 'no-store',
        // Coupe l'appel s'il traîne (l'AbortError est capté plus bas → null).
        signal: AbortSignal.timeout(IPAY_VERIFY_TIMEOUT_MS),
      },
    );

    if (!res.ok) {
      // 404 est attendu quand on interroge avec le mauvais Ipay-Payment-Type :
      // on laisse l'appelant réessayer avec l'autre type (loggé en info léger).
      Sentry.captureMessage('iPay verify: réponse non-2xx', {
        level: res.status === 404 ? 'info' : 'warning',
        extra: { reference, httpStatus: res.status, env, paymentType },
      });
      return null;
    }

    // Validation runtime : si iPay change de format un jour, on tombe en « non
    // confirmé » (fail-safe) plutôt que d'activer sur des données inattendues.
    const parsed = ipayPaymentStatusSchema.safeParse(await res.json());
    if (!parsed.success) {
      Sentry.captureMessage('iPay verify: réponse au format inattendu', {
        level: 'warning',
        extra: { reference, env, paymentType },
      });
      return null;
    }
    return parsed.data;
  } catch (err) {
    // Inclut l'AbortError (timeout) : traité comme « impossible de confirmer ».
    Sentry.captureException(err, {
      tags: { context: 'ipay-verify' },
      extra: { reference, paymentType },
    });
    return null;
  }
}

/**
 * Vérifie le statut réel d'un paiement iPay par sa référence.
 *
 * L'endpoint de statut exige un header Ipay-Payment-Type ('mobile' | 'card') ;
 * comme on ne sait pas toujours à l'avance quel moyen le client a utilisé (page
 * de paiement hébergée iPay), on tente 'mobile' puis 'card'. On retourne la
 * première réponse exploitable, ou null si aucune ne l'est.
 */
export async function verifyIPayPayment(
  reference: string,
): Promise<IPayPaymentStatus | null> {
  const viaMobile = await fetchIPayPaymentStatus(reference, 'mobile');
  if (viaMobile) return viaMobile;
  return fetchIPayPaymentStatus(reference, 'card');
}

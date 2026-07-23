import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { logAuditEvent } from '@/lib/audit';
import { getBillingOption, getBillingCycleLabel, getIPayChargeAmount, MAX_DYNAMIC_PRICE, type BillingCycle } from '@/config/pricing';
import { sendTransactionalEmail } from '@/lib/email';
import { paymentConfirmationEmail } from '@/lib/email-templates';
import { applyOverridesTo } from '@/lib/emails/overrides';
import { upsertNewsletterSubscriber } from '@/lib/newsletter/subscribers';
import { issueInvoice } from '@/lib/invoices/issue';
import { SITE_URL } from '@/lib/config';
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/rate-limit';
import { verifyIPayPayment, isIPaySucceeded, isIPayFailed } from '@/lib/ipaymoney';
import * as Sentry from '@sentry/nextjs';

type ServiceClient = NonNullable<ReturnType<typeof createServiceClient>>;

interface PaymentRow {
  id: string;
  user_id: string;
  billing_cycle: string | null;
  amount: number;
  status: string;
}

const WEBHOOK_SECRET = process.env.IPAYMONEY_WEBHOOK_SECRET;

/**
 * Vérifie qu'un callback iPayMoney provient bien d'une source autorisée.
 *
 * iPay signe ses webhooks avec un header contenant le « secret hash » du marchand
 * (configuré dans le dashboard iPay > Développeurs > Webhook). Sources acceptées :
 *  1. `x-iPayMoney-secret: <secret>` (format officiel iPay)
 *  2. `secret-hash: <secret>` (alias documenté par iPay)
 *  3. `X-Webhook-Secret` / `Authorization: Bearer` (compat. legacy interne)
 *
 * Ce header n'est qu'une PREMIÈRE barrière. La garantie de sécurité réelle est
 * la vérification serveur-à-serveur (verifyIPayPayment) faite plus bas : on ne
 * fait confiance à aucun statut reçu par webhook, on reconfirme toujours le
 * paiement directement auprès d'iPay avec la clé secrète.
 *
 * Sec H-6 : on n'accepte jamais le secret dans le body JSON (risque de fuite
 * via un log applicatif un peu trop verbeux).
 *
 * En l'absence de IPAYMONEY_WEBHOOK_SECRET :
 *  - production : refuser tous les callbacks et alerter Sentry (faille critique)
 *  - dev/test   : accepter pour permettre les tests locaux
 */
function verifyWebhookAuth(request: NextRequest): boolean {
  if (!WEBHOOK_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      Sentry.captureMessage('IPAYMONEY_WEBHOOK_SECRET non configuré en production', { level: 'error' });
      return false;
    }
    return true;
  }

  const provided =
    request.headers.get('x-ipaymoney-secret') ||
    request.headers.get('secret-hash') ||
    request.headers.get('x-webhook-secret') ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim() ||
    null;

  if (!provided) return false;

  try {
    const a = Buffer.from(provided, 'utf8');
    const b = Buffer.from(WEBHOOK_SECRET, 'utf8');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** Date d'expiration de l'abonnement pour un cycle de facturation donné. */
function computeExpiry(billingCycle: BillingCycle): Date {
  const { durationMonths } = getBillingOption(billingCycle);
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + durationMonths);
  return expiresAt;
}

/**
 * Claim atomique : passe la transaction de 'pending' à 'verified' en UNE seule
 * opération conditionnelle (`... WHERE id = X AND status = 'pending'`). Retourne
 * true si CETTE exécution a gagné le claim (elle seule exécute les effets
 * d'activation), false si une autre l'avait déjà fait (webhook rejoué / livré en
 * double). Empêche toute double-activation et toute facture dupliquée.
 */
async function claimPaymentVerified(
  serviceClient: ServiceClient,
  paymentRequestId: string,
  expiresAt: Date,
  now: string,
): Promise<boolean> {
  const { data, error } = await serviceClient
    .from('payment_requests')
    .update({
      status: 'verified',
      verified_at: now,
      subscription_expires_at: expiresAt.toISOString(),
      updated_at: now,
    })
    .eq('id', paymentRequestId)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle();

  if (error) {
    Sentry.captureException(error, { tags: { context: 'ipaymoney-claim' } });
    return false;
  }
  return data !== null;
}

/** Préserve le rôle admin, sinon promeut l'utilisateur en 'premium'. */
async function resolvePremiumRole(
  serviceClient: ServiceClient,
  userId: string,
): Promise<'admin' | 'premium'> {
  const { data } = await serviceClient
    .from('user_profiles')
    .select('role')
    .eq('id', userId)
    .single();
  return data?.role === 'admin' ? 'admin' : 'premium';
}

/** Upsert de la ligne subscriptions (une par utilisateur). */
async function upsertPremiumSubscription(
  serviceClient: ServiceClient,
  userId: string,
  billingCycle: BillingCycle,
  amount: number,
  now: string,
  expiresAt: Date,
): Promise<void> {
  const { error } = await serviceClient.from('subscriptions').upsert(
    {
      user_id: userId,
      tier: 'premium',
      status: 'active',
      billing_cycle: billingCycle,
      current_period_start: now,
      current_period_end: expiresAt.toISOString(),
      price_amount: amount,
    },
    { onConflict: 'user_id' },
  );
  if (error) Sentry.captureException(error, { tags: { context: 'ipaymoney-subscription-upsert' } });
}

/** Bascule le profil utilisateur en Premium actif (champ qui gate l'accès). */
async function activatePremiumProfile(
  serviceClient: ServiceClient,
  userId: string,
  role: 'admin' | 'premium',
  now: string,
  expiresAt: Date,
): Promise<void> {
  const patch = {
    role,
    subscription_status: 'active',
    subscription_start: now,
    subscription_end: expiresAt.toISOString(),
    subscription_updated_at: now,
    expiration_warning_sent: false,
    updated_at: now,
  };
  const { error } = await serviceClient.from('user_profiles').update(patch).eq('id', userId);
  if (!error) return;

  // Champ critique : un unique retry, dont on vérifie explicitement l'échec.
  Sentry.captureException(error, { tags: { context: 'ipaymoney-profile-update' } });
  const { error: retryErr } = await serviceClient.from('user_profiles').update(patch).eq('id', userId);
  if (retryErr) {
    Sentry.captureException(retryErr, {
      level: 'fatal',
      tags: { context: 'ipaymoney-profile-update-retry' },
      extra: { userId },
    });
  }
}

/** Email de confirmation + auto-abo newsletter + émission de la facture. */
async function notifyAndInvoicePremium(
  serviceClient: ServiceClient,
  userId: string,
  billingCycle: BillingCycle,
  amount: number,
  iPayReference: string,
  now: string,
  expiresAt: Date,
): Promise<void> {
  const { data: profile } = await serviceClient
    .from('user_profiles')
    .select('email, full_name')
    .eq('id', userId)
    .single();

  if (profile?.email) {
    const confirmation = await applyOverridesTo(
      'payment_confirmation',
      paymentConfirmationEmail(profile.full_name || 'Client', 'premium', billingCycle, expiresAt.toISOString()),
    );
    await sendTransactionalEmail({ to: profile.email, ...confirmation, emailType: 'payment_confirmation', userId }).catch((err) =>
      Sentry.captureException(err, { tags: { context: 'ipaymoney-confirmation-email' }, extra: { userId } }),
    );
    // Auto-abo newsletter pour tout nouveau Premium (idempotent : no-op si déjà abonné).
    await upsertNewsletterSubscriber({ email: profile.email, source: 'premium_upgrade', userId }).catch((err) =>
      Sentry.captureException(err, { tags: { context: 'ipaymoney-newsletter-auto-sub' }, extra: { userId } }),
    );
  }

  const cycleLabelLower = getBillingCycleLabel(billingCycle).toLowerCase();
  // Émission de facture (fire-and-forget : ne doit pas bloquer l'ACK au webhook).
  issueInvoice({
    userId,
    amountXof: amount,
    description: `Abonnement Premium NFI Report (${cycleLabelLower})`,
    lineItems: [
      {
        description: `Premium ${cycleLabelLower}, accès illimité aux articles, analyses, simulateurs et briefings exclusifs (du ${new Date(now).toLocaleDateString('fr-FR')} au ${expiresAt.toLocaleDateString('fr-FR')}).`,
        qty: 1,
        unitPriceXof: amount,
        totalXof: amount,
      },
    ],
    paymentMethod: 'iPayMoney',
    paymentReference: iPayReference,
    billingCycle,
    periodStart: now,
    periodEnd: expiresAt.toISOString(),
  }).catch((err) =>
    Sentry.captureException(err, {
      tags: { context: 'invoice-issue-after-ipaymoney' },
      extra: { userId, iPayReference },
    }),
  );
}

/**
 * Active l'abonnement Premium après un paiement iPay CONFIRMÉ.
 * Retourne false si la transaction avait déjà été activée ailleurs (idempotence).
 */
async function activatePremium(
  serviceClient: ServiceClient,
  paymentRequest: PaymentRow,
  iPayReference: string,
): Promise<boolean> {
  const billingCycle = (paymentRequest.billing_cycle || 'monthly') as BillingCycle;
  const { amount, user_id: userId } = paymentRequest;
  const now = new Date().toISOString();
  const expiresAt = computeExpiry(billingCycle);

  // Verrou d'idempotence atomique : une seule exécution passe les effets de bord.
  const won = await claimPaymentVerified(serviceClient, paymentRequest.id, expiresAt, now);
  if (!won) return false;

  const role = await resolvePremiumRole(serviceClient, userId);
  await upsertPremiumSubscription(serviceClient, userId, billingCycle, amount, now, expiresAt);
  await activatePremiumProfile(serviceClient, userId, role, now, expiresAt);

  await logAuditEvent('system', 'ipaymoney_payment_verified', 'payment', paymentRequest.id, {
    user_id: userId,
    tier: 'premium',
    billing_cycle: billingCycle,
    amount,
    ipaymoney_ref: iPayReference,
    expiresAt: expiresAt.toISOString(),
  });

  await notifyAndInvoicePremium(serviceClient, userId, billingCycle, amount, iPayReference, now, expiresAt);
  return true;
}

/**
 * POST, Callback from iPayMoney SDK / server.
 * Receives payment status, verifies transaction server-side, activates subscription.
 */
export async function POST(request: NextRequest) {
  try {
    // 1) Rate-limit par IP (anti brute-force sur le transaction_number).
    const ip = getClientIP(request);
    const rl = await checkRateLimit(`ipaymoney-callback:${ip}`, RATE_LIMITS.paymentCallback.limit, RATE_LIMITS.paymentCallback.windowMs);
    if (rl.limited) {
      Sentry.captureMessage('iPayMoney callback rate-limited', { level: 'warning', extra: { ip } });
      return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 });
    }

    const serviceClient = createServiceClient();
    if (!serviceClient) {
      return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });
    }

    // 2) Authenticité AVANT toute autre opération (defense-in-depth) : un appelant
    //    non authentifié n'obtient aucune information, pas même sur son propre body.
    if (!verifyWebhookAuth(request)) {
      Sentry.captureMessage('iPayMoney callback unauthorized', {
        level: 'warning',
        extra: { ip, hasSecret: !!WEBHOOK_SECRET },
      });
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // 3) Lire le corps. iPay envoie du JSON au format :
    //    { "data": { "external_reference", "reference", "status", "msisdn" } }
    //    On garde un fallback form-encoded par robustesse.
    const rawBody = await request.text();
    let payload: Record<string, unknown>;
    const contentType = request.headers.get('content-type') || '';
    try {
      if (contentType.includes('application/json') || rawBody.trimStart().startsWith('{')) {
        payload = JSON.parse(rawBody);
      } else {
        payload = Object.fromEntries(new URLSearchParams(rawBody).entries());
      }
    } catch {
      return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 });
    }

    // 4) Extraire les champs (format iPay imbriqué dans `data`, fallback plat).
    const data: Record<string, unknown> =
      payload.data && typeof payload.data === 'object'
        ? (payload.data as Record<string, unknown>)
        : payload;
    // `external_reference` = NOTRE référence (transaction_number, ex. NFI-XXXX).
    const externalRef =
      (data.external_reference as string) ||
      (data.transaction_id as string) ||
      (data.transactionId as string) ||
      '';
    // `reference` = référence propre à iPay, requise pour la vérification serveur.
    const iPayReference = (data.reference as string) || '';
    const notifiedStatus = data.status as string | undefined;

    if (!externalRef) {
      Sentry.captureMessage('iPayMoney callback missing external_reference', {
        level: 'warning',
        extra: { payloadKeys: Object.keys(data) },
      });
      return NextResponse.json({ error: 'external_reference manquant' }, { status: 400 });
    }

    // 5) Retrouver la transaction locale. On distingue « pas de ligne » (404, normal)
    //    d'une vraie panne DB (500) : un 404 n'est en général pas rejoué par iPay,
    //    alors qu'un 5xx l'est — on veut donc un 500 en cas d'erreur transitoire.
    const { data: paymentRequest, error: lookupErr } = await serviceClient
      .from('payment_requests')
      .select('*')
      .eq('transaction_number', externalRef)
      .eq('payment_method', 'ipaymoney')
      .maybeSingle();

    if (lookupErr) {
      Sentry.captureException(lookupErr, {
        tags: { context: 'ipaymoney-callback-lookup' },
        extra: { externalRef },
      });
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
    if (!paymentRequest) {
      return NextResponse.json({ error: 'Transaction introuvable' }, { status: 404 });
    }

    // 6) Idempotence : déjà traité => on acquitte sans rien refaire.
    if (paymentRequest.status === 'verified') {
      return NextResponse.json({ success: true, message: 'Déjà traité' });
    }

    // 7) Sans référence iPay, aucune vérification serveur possible => en attente.
    if (!iPayReference) {
      Sentry.captureMessage('iPayMoney callback sans reference iPay, vérification impossible', {
        level: 'warning',
        extra: { externalRef, notifiedStatus },
      });
      return NextResponse.json({ success: true, pending: true });
    }

    // 8) VÉRIFICATION SERVEUR-À-SERVEUR (verrou de sécurité central) : on ne fait
    //    JAMAIS confiance au statut du webhook, on reconfirme auprès d'iPay avec la
    //    clé secrète l'état réel du paiement.
    const verified = await verifyIPayPayment(iPayReference);

    if (verified && isIPaySucceeded(verified.status)) {
      // Fail-closed sur le lien de référence :
      //  - présente mais différente => incohérence/attaque => 400
      //  - absente => impossible de lier avec certitude => on laisse en attente
      if (verified.external_reference && verified.external_reference !== externalRef) {
        Sentry.captureMessage('iPayMoney verify external_reference mismatch', {
          level: 'error',
          extra: { externalRef, got: verified.external_reference, iPayReference },
        });
        return NextResponse.json({ error: 'reference mismatch' }, { status: 400 });
      }
      if (!verified.external_reference) {
        Sentry.captureMessage('iPayMoney verify sans external_reference, non activé', {
          level: 'warning',
          extra: { externalRef, iPayReference },
        });
        return NextResponse.json({ success: true, pending: true });
      }

      // Anti-fraude DB : le montant gele doit etre un entier dans la plage
      // legitime pour ce cycle. Un prix dynamique (override admin) ne descend
      // jamais sous le prix config (plancher) et ne depasse jamais le plafond.
      // Borne basse = defense contre « payer moins » ; borne haute = anti-aberration.
      // On ne recompare PAS a un prix « live » recalcule : le montant a ete resolu
      // et GELE cote serveur au checkout (getServerPrice), donc un changement de
      // prix admin entre le checkout et le callback ne doit pas rejeter a tort un
      // paiement legitime deja engage par le client.
      const billingCycle = (paymentRequest.billing_cycle || 'monthly') as BillingCycle;
      const billingOption = getBillingOption(billingCycle);
      const priceFloor = billingOption.price;
      if (
        !Number.isInteger(paymentRequest.amount) ||
        paymentRequest.amount < priceFloor ||
        paymentRequest.amount > MAX_DYNAMIC_PRICE
      ) {
        Sentry.captureMessage('iPayMoney callback amount hors plage legitime', {
          level: 'error',
          extra: {
            floor: priceFloor,
            max: MAX_DYNAMIC_PRICE,
            got: paymentRequest.amount,
            billingCycle,
            externalRef,
            userId: paymentRequest.user_id,
          },
        });
        return NextResponse.json({ error: 'amount invalid' }, { status: 400 });
      }

      // Anti SOUS-PAIEMENT (verrou central) : le montant que le client fixe cote
      // navigateur au moment de creer le jeton iPay n'est PAS de confiance. Un
      // fraudeur peut forger un jeton a 100 FCFA pour un abonnement a 50 000.
      // iPay renvoie `amount` = montant de BASE reellement encaisse (ce qu'on lui
      // envoie normalement, ex. 48 543 pour 50 000). On exige que le paye soit au
      // moins le montant attendu ; sinon on REFUSE d'activer (fraude probable).
      const expectedIpayAmount = getIPayChargeAmount(paymentRequest.amount);
      const paidAmount = verified.amount;
      if (typeof paidAmount !== 'number' || !Number.isFinite(paidAmount)) {
        // Montant introuvable dans la verif => on NE peut PAS confirmer => on
        // laisse en attente et on demande a iPay de reessayer (jamais d'activation
        // sans montant confirme). Alerte pour investigation.
        Sentry.captureMessage('iPayMoney: montant paye absent de la verification, activation differee', {
          level: 'warning',
          extra: { externalRef, iPayReference, expectedIpayAmount },
        });
        return NextResponse.json({ success: false, pending: true, retry: true }, { status: 503 });
      }
      if (paidAmount < expectedIpayAmount) {
        Sentry.captureMessage('iPayMoney: SOUS-PAIEMENT detecte, activation refusee', {
          level: 'error',
          extra: {
            externalRef,
            iPayReference,
            expectedIpayAmount,
            paidAmount,
            displayPrice: paymentRequest.amount,
            billingCycle,
            userId: paymentRequest.user_id,
          },
        });
        await serviceClient
          .from('payment_requests')
          .update({
            status: 'rejected',
            rejection_reason: `Sous-paiement iPay : paye ${paidAmount}, attendu >= ${expectedIpayAmount}`,
            updated_at: new Date().toISOString(),
          })
          .eq('id', paymentRequest.id)
          .eq('status', 'pending');
        return NextResponse.json({ error: 'underpayment' }, { status: 400 });
      }

      await activatePremium(serviceClient, paymentRequest as PaymentRow, iPayReference);
      return NextResponse.json({ success: true });
    }

    // 9) Échec confirmé par iPay (ou notifié comme tel) => rejeter proprement.
    if ((verified && isIPayFailed(verified.status)) || isIPayFailed(notifiedStatus)) {
      const reason = verified?.status || notifiedStatus || 'failed';
      const { error: rejErr } = await serviceClient
        .from('payment_requests')
        .update({
          status: 'rejected',
          rejection_reason: `iPayMoney: ${reason}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', paymentRequest.id)
        .eq('status', 'pending');
      if (rejErr) Sentry.captureException(rejErr, { tags: { context: 'ipaymoney-reject' } });

      await logAuditEvent('system', 'ipaymoney_payment_failed', 'payment', paymentRequest.id, {
        user_id: paymentRequest.user_id,
        status: reason,
        external_reference: externalRef,
        ipay_reference: iPayReference,
      });

      return NextResponse.json({ success: true, status: reason });
    }

    // 10) Statut non confirmé (vérif serveur momentanément injoignable, ou paiement
    //     encore 'pending' côté iPay). Sécurité : aucune activation sans confirmation.
    //     iPay réessaie le webhook (jusqu'à 5 fois, ~500ms d'intervalle) sur toute
    //     réponse NON-2xx : on renvoie donc un 503 pour PROVOQUER ces réessais. Si
    //     notre vérification serveur-à-serveur était juste indisponible à l'instant du
    //     webhook, un prochain essai la confirmera et activera le Premium, au lieu de
    //     laisser un client qui a payé bloqué en 'pending'. La transaction reste
    //     'pending' d'ici là. On NE log PAS le payload brut (téléphone/nom = PII).
    Sentry.captureMessage('iPayMoney callback non confirmé, réessai iPay demandé (503)', {
      level: 'info',
      extra: {
        externalRef,
        iPayReference,
        notifiedStatus,
        verifiedStatus: verified?.status ?? null,
        verifyReachable: verified !== null,
      },
    });
    return NextResponse.json({ success: false, pending: true, retry: true }, { status: 503 });
  } catch (err) {
    Sentry.captureException(err, { tags: { context: 'ipaymoney-callback' } });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * GET, User redirect after payment on iPayMoney.
 * Checks payment status and redirects to success or failure page.
 */
export async function GET(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get('ref');
  const siteUrl = SITE_URL;

  if (!ref) {
    return NextResponse.redirect(`${siteUrl}/pricing?checkout=cancelled`);
  }

  try {
    const serviceClient = createServiceClient();
    if (!serviceClient) {
      return NextResponse.redirect(`${siteUrl}/pricing?checkout=error`);
    }

    // Find matching payment request
    const { data: paymentRequest } = await serviceClient
      .from('payment_requests')
      .select('*')
      .eq('transaction_number', ref)
      .eq('payment_method', 'ipaymoney')
      .single();

    if (!paymentRequest) {
      return NextResponse.redirect(`${siteUrl}/pricing?checkout=error`);
    }

    if (paymentRequest.status === 'verified') {
      // Already activated (by callback)
      return NextResponse.redirect(`${siteUrl}/compte?checkout=success`);
    }

    // Payment not yet confirmed, show a pending page
    // The callback POST may arrive shortly after the redirect
    return NextResponse.redirect(`${siteUrl}/compte?checkout=pending`);
  } catch (err) {
    Sentry.captureException(err, { tags: { context: 'ipaymoney-callback-redirect' } });
    return NextResponse.redirect(`${siteUrl}/pricing?checkout=error`);
  }
}

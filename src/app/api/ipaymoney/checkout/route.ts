import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { safeParseJSON } from '@/lib/validation';
import { checkRateLimit } from '@/lib/rate-limit';
import { isValidBillingCycle, getIPayChargeAmount } from '@/config/pricing';
import { getServerPrice } from '@/lib/pricing-server';
import { SITE_URL } from '@/lib/config';
import * as Sentry from '@sentry/nextjs';
import crypto from 'crypto';

/**
 * POST, Create a payment_request record and return transaction details
 * for the iPayMoney JavaScript SDK (client-side checkout.js).
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Rate limit: 5 checkout attempts per hour
    const rl = await checkRateLimit(`ipaymoney-checkout:${user.id}`, 5, 60 * 60 * 1000);
    if (rl.limited) {
      return NextResponse.json({ error: 'Trop de tentatives. Réessayez plus tard.' }, { status: 429 });
    }

    const body = await safeParseJSON(request);
    if (!body) {
      return NextResponse.json({ error: 'Corps de requête JSON invalide' }, { status: 400 });
    }

    const { tier, billingCycle } = body as {
      tier?: string;
      billingCycle?: string;
    };

    if (tier !== 'premium') {
      return NextResponse.json({ error: 'Plan invalide' }, { status: 400 });
    }

    if (!billingCycle || !isValidBillingCycle(billingCycle)) {
      return NextResponse.json({ error: 'Durée invalide' }, { status: 400 });
    }

    // Prix canonique resolu COTE SERVEUR (override admin dynamic_pricing sinon
    // config). C'est ce prix qui est affiche, gele dans payment_requests, facture
    // et re-valide au callback : une seule et meme valeur de bout en bout.
    const amount = await getServerPrice(billingCycle);
    // Montant envoye a iPay, reduit pour que le client paie EXACTEMENT le prix
    // affiche une fois les ~3% iPayMoney (arrondis a l'entier superieur) ajoutes.
    // NFI absorbe les frais. Voir getIPayChargeAmount / ipayCustomerTotal.
    const ipayAmount = getIPayChargeAmount(amount);

    // Generate a unique transaction reference
    const transactionId = `NFI-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

    const siteUrl = SITE_URL;

    // La ligne payment_requests DOIT exister avant d'ouvrir le paiement : le
    // callback iPay la retrouve par transaction_number. Si elle manque, un
    // paiement réel arriverait sur une transaction « introuvable » (argent
    // encaissé, aucune activation). On échoue donc explicitement plutôt que de
    // renvoyer un transactionId sans ligne DB correspondante.
    const { createServiceClient } = await import('@/lib/supabase');
    const serviceClient = createServiceClient();
    if (!serviceClient) {
      return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });
    }
    const { error: insertErr } = await serviceClient.from('payment_requests').insert({
      user_id: user.id,
      tier: 'premium',
      billing_cycle: billingCycle,
      amount,
      payment_method: 'ipaymoney',
      transaction_number: transactionId,
      status: 'pending',
    });
    if (insertErr) {
      Sentry.captureException(insertErr, { tags: { context: 'ipaymoney-checkout-insert' } });
      return NextResponse.json({ error: 'Impossible d\'initialiser le paiement. Réessayez.' }, { status: 500 });
    }

    // Return the details needed by the iPayMoney JS SDK
    return NextResponse.json({
      transactionId,
      // On envoie le montant reduit : + les 3% iPay, le client paie le prix rond.
      amount: String(ipayAmount),
      redirectUrl: `${siteUrl}/api/ipaymoney/callback?ref=${transactionId}`,
      callbackUrl: `${siteUrl}/api/ipaymoney/callback`,
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { context: 'ipaymoney-checkout' } });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

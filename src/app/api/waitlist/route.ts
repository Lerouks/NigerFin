import { NextRequest, NextResponse } from 'next/server';
import { isValidEmail, safeParseJSON } from '@/lib/validation';
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/rate-limit';
import { upsertNewsletterSubscriber } from '@/lib/newsletter/subscribers';
import * as Sentry from '@sentry/nextjs';

/**
 * Inscription à la liste de lancement (mode pré-lancement / page « Prochainement »).
 *
 * Ajoute l'email à newsletter_subscribers avec source='prelaunch' (idempotent).
 * Volontairement AUCUN email de confirmation n'est envoyé à ce stade : le site
 * est en test, on ne veut rien envoyer aux inscrits avant le vrai lancement.
 */
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request);

    const rl = await checkRateLimit(
      `waitlist:${ip}`,
      RATE_LIMITS.newsletter.limit,
      RATE_LIMITS.newsletter.windowMs,
    );
    if (rl.limited) {
      return NextResponse.json(
        { error: 'Trop de requêtes. Réessayez plus tard.' },
        { status: 429 },
      );
    }

    const body = await safeParseJSON(request);
    if (!body) {
      return NextResponse.json({ error: 'Corps de requête JSON invalide' }, { status: 400 });
    }

    const { email } = body as { email?: string };
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
    }

    // Source de vérité : newsletter_subscribers (upsert idempotent). source='prelaunch'
    // permet de distinguer la liste de lancement des inscrits classiques.
    await upsertNewsletterSubscriber({ email: email!, source: 'prelaunch' });

    return NextResponse.json({ success: true });
  } catch (err) {
    Sentry.captureException(err, { tags: { context: 'waitlist-subscribe' } });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

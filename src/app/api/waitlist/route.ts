import { NextRequest, NextResponse } from 'next/server';
import { isValidEmail, safeParseJSON } from '@/lib/validation';
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/rate-limit';
import { SOURCE_LISTE_ATTENTE, upsertNewsletterSubscriber } from '@/lib/newsletter/subscribers';
import { sendTransactionalEmail } from '@/lib/email';
import { waitlistConfirmationEmail } from '@/lib/email-templates';
import { applyOverridesTo } from '@/lib/emails/overrides';
import { normalizeEmail } from '@/lib/validation';
import * as Sentry from '@sentry/nextjs';

/**
 * Inscription à la liste d'attente (pré-lancement).
 *
 * Ajoute l'adresse à newsletter_subscribers avec la source « prelaunch »
 * (idempotent) : la newsletter ne lui part pas (voir recoitLaNewsletter).
 * Depuis le 23/11/2026, décision de Raouf : une confirmation part à chaque
 * nouvelle inscription, sans lien ni en-tête de désabonnement (la liste
 * d'attente ne se quitte pas). Rien n'est envoyé à une adresse déjà inscrite.
 * Un échec d'envoi n'empêche pas l'inscription.
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
    const result = await upsertNewsletterSubscriber({ email: email!, source: SOURCE_LISTE_ATTENTE });

    if (result.isNew || result.reactivated) {
      const mail = await applyOverridesTo('waitlist_confirmation', waitlistConfirmationEmail());
      await sendTransactionalEmail({
        to: normalizeEmail(email!),
        subject: mail.subject,
        html: mail.html,
        emailType: 'waitlist_confirmation',
      }).catch((err) => {
        Sentry.captureException(err, { tags: { context: 'waitlist-confirmation-email' } });
      });
    }

    // Comme /api/newsletter : le formulaire dit « déjà inscrite » quand rien n'a changé.
    return NextResponse.json({ success: true, isNew: result.isNew, reactivated: result.reactivated });
  } catch (err) {
    Sentry.captureException(err, { tags: { context: 'waitlist-subscribe' } });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

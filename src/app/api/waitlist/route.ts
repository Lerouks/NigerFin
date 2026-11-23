import { NextRequest, NextResponse } from 'next/server';
import { isValidEmail, safeParseJSON } from '@/lib/validation';
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/rate-limit';
import { lienDesinscription, SOURCE_LISTE_ATTENTE, upsertNewsletterSubscriber } from '@/lib/newsletter/subscribers';
import { sendTransactionalEmail } from '@/lib/email';
import { waitlistConfirmationEmail } from '@/lib/email-templates';
import { applyOverridesTo } from '@/lib/emails/overrides';
import { ecrireAuContact } from '@/lib/emails/edition';
import { normalizeEmail } from '@/lib/validation';
import * as Sentry from '@sentry/nextjs';

/**
 * Inscription à la liste d'attente (pré-lancement).
 *
 * Ajoute l'adresse à newsletter_subscribers avec la source « prelaunch »
 * (idempotent) : la newsletter ne lui part pas (voir recoitLaNewsletter).
 * Depuis le 23/11/2026, décision de Raouf : une confirmation part à chaque
 * nouvelle inscription, avec un lien pour quitter la liste. Rien n'est envoyé
 * à une adresse déjà inscrite. Un échec d'envoi n'empêche pas l'inscription.
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
      const desinscription = await lienDesinscription(result.id);
      const mail = await applyOverridesTo(
        'waitlist_confirmation',
        waitlistConfirmationEmail({ unsubscribeUrl: desinscription ?? ecrireAuContact('Quitter la liste d’attente') }),
      );
      await sendTransactionalEmail({
        to: normalizeEmail(email!),
        subject: mail.subject,
        html: mail.html,
        emailType: 'waitlist_confirmation',
        ...(desinscription ? { unsubscribeUrl: desinscription } : {}),
      }).catch((err) => {
        Sentry.captureException(err, { tags: { context: 'waitlist-confirmation-email' } });
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    Sentry.captureException(err, { tags: { context: 'waitlist-subscribe' } });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

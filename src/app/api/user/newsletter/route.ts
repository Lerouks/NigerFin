import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';
import { createServerSupabaseClient } from '@/lib/supabase';
import { parseJsonBody } from '@/lib/validation';
import { checkRateLimit } from '@/lib/rate-limit';
import { sendTransactionalEmail } from '@/lib/email';
import { newsletterWelcomeEmail } from '@/lib/email-templates';
import { applyOverridesTo } from '@/lib/emails/overrides';
import { lienDesinscription } from '@/lib/newsletter/subscribers';
import { changerNewsletterDuCompte } from '@/lib/newsletter/compte';

const Changement = z.object({ recevoir: z.boolean() });

/**
 * L'interrupteur « Recevoir la newsletter » de « Mon compte », sur l'adresse
 * confirmée du compte. Répond l'état réel après le changement : une adresse
 * bloquée (rebond, plainte) reste coupée, et la page le dit.
 */
export async function PUT(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  if (!user.email || !user.email_confirmed_at) {
    return NextResponse.json({ error: 'Confirmez d’abord votre adresse e-mail.' }, { status: 403 });
  }

  const rl = await checkRateLimit(`compte-newsletter:${user.id}`, 20, 60 * 60 * 1000);
  if (rl.limited) {
    return NextResponse.json({ error: 'Trop de changements. Réessayez dans une heure.' }, { status: 429 });
  }

  const corps = await parseJsonBody(request, Changement);
  if (!corps.ok) return NextResponse.json({ error: corps.error }, { status: corps.status });

  try {
    const { etat, bienvenuePour } = await changerNewsletterDuCompte({
      email: user.email,
      userId: user.id,
      recevoir: corps.data.recevoir,
    });

    // Le même mail de bienvenue que l'inscription depuis le site, à la première
    // inscription ou au retour après un désabonnement.
    if (bienvenuePour) {
      const desinscription = await lienDesinscription(bienvenuePour);
      const bienvenue = await applyOverridesTo('newsletter_welcome', newsletterWelcomeEmail(desinscription));
      await sendTransactionalEmail({
        to: user.email,
        subject: bienvenue.subject,
        html: bienvenue.html,
        emailType: 'newsletter_welcome',
        userId: user.id,
        ...(desinscription ? { unsubscribeUrl: desinscription } : {}),
      }).catch((err) => {
        Sentry.captureException(err, { tags: { context: 'compte-newsletter-bienvenue' }, extra: { userId: user.id } });
      });
    }

    return NextResponse.json(etat);
  } catch (err) {
    Sentry.captureException(err, { tags: { context: 'compte-newsletter' }, extra: { userId: user.id } });
    return NextResponse.json({ error: 'Le changement n’a pas pu être enregistré. Réessayez.' }, { status: 500 });
  }
}

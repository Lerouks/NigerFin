import { NextRequest, NextResponse } from 'next/server';
import { sendTransactionalEmail } from '@/lib/email';
import { newsletterWelcomeEmail } from '@/lib/email-templates';
import { isValidEmail, safeParseJSON } from '@/lib/validation';
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/rate-limit';
import { createServerSupabaseClient } from '@/lib/supabase';
import { upsertNewsletterSubscriber } from '@/lib/newsletter/subscribers';
import * as Sentry from '@sentry/nextjs';

interface SubscribePayload {
  email?: string;
  /** Optional source hint sent by the client (e.g. 'popup', 'form_homepage'). */
  source?: string;
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request);

    // Persistent rate limit: 5 per hour per IP
    const rl = await checkRateLimit(
      `newsletter:${ip}`,
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

    const { email, source } = body as SubscribePayload;

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
    }

    // Resolve auth user if logged in (used to link the subscriber to a profile).
    let userId: string | undefined;
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) userId = user.id;
    }

    // Source of truth: newsletter_subscribers table (idempotent upsert).
    const result = await upsertNewsletterSubscriber({
      email,
      source: source ?? 'form',
      userId,
    });

    // Mirror the flag on user_profiles for connected users (legacy compatibility).
    if (supabase && userId) {
      await supabase
        .from('user_profiles')
        .update({
          newsletter_subscribed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .then(({ error }) => {
          if (error) {
            Sentry.captureException(error, {
              tags: { context: 'newsletter-subscribe-profile-flag' },
            });
          }
        });
    }

    // Send branded welcome email only on first subscription or after reactivation.
    if (result.isNew || result.reactivated) {
      const welcome = newsletterWelcomeEmail();
      await sendTransactionalEmail({
        to: email!,
        subject: welcome.subject,
        html: welcome.html,
      }).catch((err) => {
        Sentry.captureException(err, {
          tags: { context: 'newsletter-welcome-email' },
          extra: { email },
        });
      });
    }

    return NextResponse.json({
      success: true,
      isNew: result.isNew,
      reactivated: result.reactivated,
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { context: 'newsletter-subscribe' } });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

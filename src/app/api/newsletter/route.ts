import { NextRequest, NextResponse } from 'next/server';
import { subscribeToMailchimpNewsletter, sendTransactionalEmail } from '@/lib/email';
import { newsletterWelcomeEmail } from '@/lib/email-templates';
import { isValidEmail, safeParseJSON } from '@/lib/validation';
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request);

    // Persistent rate limit: 5 per hour per IP
    const rl = await checkRateLimit(`newsletter:${ip}`, RATE_LIMITS.newsletter.limit, RATE_LIMITS.newsletter.windowMs);
    if (rl.limited) {
      return NextResponse.json({ error: 'Trop de requêtes. Réessayez plus tard.' }, { status: 429 });
    }

    const body = await safeParseJSON(request);
    if (!body) {
      return NextResponse.json({ error: 'Corps de requête JSON invalide' }, { status: 400 });
    }

    const { email } = body as { email?: string };

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
    }

    // Subscribe to Mailchimp newsletter
    await subscribeToMailchimpNewsletter(email);

    // Send branded welcome email
    const welcome = newsletterWelcomeEmail();
    await sendTransactionalEmail({
      to: email,
      subject: welcome.subject,
      html: welcome.html,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

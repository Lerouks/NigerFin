import { NextRequest, NextResponse } from 'next/server';
import { sendTransactionalEmail } from '@/lib/email';
import { subscribeToBeehiiv } from '@/lib/beehiiv';
import { newsletterWelcomeEmail } from '@/lib/email-templates';
import { isValidEmail, safeParseJSON } from '@/lib/validation';
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/rate-limit';
import { createServerSupabaseClient } from '@/lib/supabase';

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

    // Subscribe to Beehiiv newsletter
    await subscribeToBeehiiv(email);

    // Send branded welcome email
    const welcome = newsletterWelcomeEmail();
    await sendTransactionalEmail({
      to: email,
      subject: welcome.subject,
      html: welcome.html,
    });

    // If user is logged in, mark newsletter_subscribed in their profile
    try {
      const supabase = await createServerSupabaseClient();
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('user_profiles')
            .update({ newsletter_subscribed: true, updated_at: new Date().toISOString() })
            .eq('id', user.id);
        }
      }
    } catch {
      // Non-blocking: profile update failure shouldn't break newsletter signup
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

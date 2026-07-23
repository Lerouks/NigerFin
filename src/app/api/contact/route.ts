import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase';
import { sendTransactionalEmail } from '@/lib/email';
import { contactConfirmationEmail, contactNotificationEmail } from '@/lib/email-templates';
import { applyOverridesTo } from '@/lib/emails/overrides';
import { parseJsonBody } from '@/lib/validation';
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/rate-limit';
import * as Sentry from '@sentry/nextjs';

const ContactBody = z.object({
  name: z.string().trim().min(2).max(200),
  email: z.string().trim().toLowerCase().email().max(254),
  subject: z.string().trim().min(2).max(200),
  message: z.string().trim().min(10).max(5000),
});

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request);

    // Persistent rate limit: 3 per hour per IP
    const rl = await checkRateLimit(`contact:${ip}`, RATE_LIMITS.contact.limit, RATE_LIMITS.contact.windowMs);
    if (rl.limited) {
      return NextResponse.json(
        { error: 'Trop de messages envoyés. Veuillez réessayer dans une heure.' },
        { status: 429 }
      );
    }

    const parsed = await parseJsonBody(request, ContactBody);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    }
    const { name, email, subject, message } = parsed.data;

    const serviceClient = createServiceClient();

    // Save to database first (must succeed even if email fails)
    let saved = false;
    if (serviceClient) {
      const { error: dbError } = await serviceClient
        .from('messages_contact')
        .insert({
          full_name: String(name).slice(0, 200),
          email: String(email).slice(0, 200),
          subject: String(subject).slice(0, 200),
          message: String(message).slice(0, 5000),
          ip_address: ip,
          status: 'unread',
        });

      if (!dbError) saved = true;
    }

    // Sanitize inputs for email HTML
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const safeName = esc(String(name));
    const safeEmail = esc(String(email));
    const safeSubject = esc(String(subject));
    const safeMessage = esc(String(message)).replace(/\n/g, '<br/>');

    // Send notification to the team (non-blocking, don't fail if email fails)
    try {
      const notification = await applyOverridesTo('contact_notification', contactNotificationEmail(safeName, safeEmail, safeSubject, safeMessage));
      await sendTransactionalEmail({
        to: 'contact@nfireport.com',
        subject: notification.subject,
        html: notification.html,
        emailType: 'contact_notification',
      });
    } catch (err) {
      Sentry.captureException(err, { tags: { context: 'contact-notification-email' } });
    }

    // Send confirmation to the user (non-blocking)
    try {
      const confirmation = await applyOverridesTo('contact_confirmation', contactConfirmationEmail(safeName));
      await sendTransactionalEmail({
        to: email,
        subject: confirmation.subject,
        html: confirmation.html,
        emailType: 'contact_confirmation',
      });
    } catch (err) {
      Sentry.captureException(err, { tags: { context: 'contact-confirmation-email' }, extra: { email } });
    }

    if (!saved && !serviceClient) {
      // If DB is unavailable, still return success (emails were attempted)
      return NextResponse.json({ success: true, warning: 'Message envoyé par email uniquement' });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

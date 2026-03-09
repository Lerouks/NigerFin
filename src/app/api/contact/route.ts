import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { sendTransactionalEmail } from '@/lib/email';
import { contactConfirmationEmail, contactNotificationEmail } from '@/lib/email-templates';

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message } = await request.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
    }

    // Get client IP for rate limiting
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';

    const serviceClient = createServiceClient();

    // Rate limiting: max 3 messages per IP per hour
    if (serviceClient) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count } = await serviceClient
        .from('messages_contact')
        .select('id', { count: 'exact', head: true })
        .eq('ip_address', ip)
        .gte('created_at', oneHourAgo);

      if (count !== null && count >= 3) {
        return NextResponse.json(
          { error: 'Trop de messages envoyés. Veuillez réessayer dans une heure.' },
          { status: 429 }
        );
      }
    }

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

    // Send notification to the team (non-blocking — don't fail if email fails)
    try {
      const notification = contactNotificationEmail(safeName, safeEmail, safeSubject, safeMessage);
      await sendTransactionalEmail({
        to: 'contact@nfireport.com',
        subject: notification.subject,
        html: notification.html,
      });
    } catch {
      // Email notification failure should not block the response
    }

    // Send confirmation to the user (non-blocking)
    try {
      const confirmation = contactConfirmationEmail(safeName);
      await sendTransactionalEmail({
        to: email,
        subject: confirmation.subject,
        html: confirmation.html,
      });
    } catch {
      // Email confirmation failure should not block the response
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

import { NextRequest, NextResponse } from 'next/server';
import { subscribeToMailchimpNewsletter, sendTransactionalEmail } from '@/lib/email';
import { newsletterWelcomeEmail } from '@/lib/email-templates';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string' || !email.includes('@')) {
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

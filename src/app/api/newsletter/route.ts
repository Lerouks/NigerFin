import { NextRequest, NextResponse } from 'next/server';
import { subscribeToMailchimpNewsletter } from '@/lib/email';
import { sendTransactionalEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
    }

    // Subscribe to Mailchimp newsletter
    await subscribeToMailchimpNewsletter(email);

    // Send welcome email via Resend
    await sendTransactionalEmail({
      to: email,
      subject: 'Bienvenue sur NFI Report !',
      html: `
        <h1>Bienvenue sur NFI Report</h1>
        <p>Merci de vous être inscrit à notre newsletter.</p>
        <p>Vous recevrez régulièrement nos analyses économiques et financières du Niger et de l'Afrique de l'Ouest.</p>
        <p>À bientôt,<br/>L'équipe NFI Report</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

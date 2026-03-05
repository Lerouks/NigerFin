import { NextRequest, NextResponse } from 'next/server';
import { sendTransactionalEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message } = await request.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
    }

    // Send notification to the team
    await sendTransactionalEmail({
      to: 'contact@nfireport.com',
      subject: `[Contact] ${subject} - ${name}`,
      html: `
        <h2>Nouveau message de contact</h2>
        <p><strong>Nom :</strong> ${name}</p>
        <p><strong>Email :</strong> ${email}</p>
        <p><strong>Sujet :</strong> ${subject}</p>
        <p><strong>Message :</strong></p>
        <p>${message}</p>
      `,
    });

    // Send confirmation to the user
    await sendTransactionalEmail({
      to: email,
      subject: 'Nous avons bien reçu votre message - NFI Report',
      html: `
        <h2>Merci pour votre message</h2>
        <p>Bonjour ${name},</p>
        <p>Nous avons bien reçu votre message et notre équipe vous répondra dans les plus brefs délais.</p>
        <p>Cordialement,<br/>L'équipe NFI Report</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

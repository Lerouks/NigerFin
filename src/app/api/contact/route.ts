import { NextRequest, NextResponse } from 'next/server';
import { sendTransactionalEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message } = await request.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
    }

    // Sanitize inputs to prevent HTML injection
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const safeName = esc(String(name));
    const safeEmail = esc(String(email));
    const safeSubject = esc(String(subject));
    const safeMessage = esc(String(message)).replace(/\n/g, '<br/>');

    // Send notification to the team
    await sendTransactionalEmail({
      to: 'contact@nfireport.com',
      subject: `[Contact] ${safeSubject} - ${safeName}`,
      html: `
        <h2>Nouveau message de contact</h2>
        <p><strong>Nom :</strong> ${safeName}</p>
        <p><strong>Email :</strong> ${safeEmail}</p>
        <p><strong>Sujet :</strong> ${safeSubject}</p>
        <p><strong>Message :</strong></p>
        <p>${safeMessage}</p>
      `,
    });

    // Send confirmation to the user
    await sendTransactionalEmail({
      to: email,
      subject: 'Nous avons bien reçu votre message - NFI Report',
      html: `
        <h2>Merci pour votre message</h2>
        <p>Bonjour ${safeName},</p>
        <p>Nous avons bien reçu votre message et notre équipe vous répondra dans les plus brefs délais.</p>
        <p>Cordialement,<br/>L'équipe NFI Report</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

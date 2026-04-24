import { Resend } from 'resend';
import * as Sentry from '@sentry/nextjs';

let resendInstance: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    console.error('[EMAIL] RESEND_API_KEY is not configured');
    return null;
  }
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
}

/** Strip HTML tags to produce a plain-text version of the email */
function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '  • ')
    .replace(/<a[^>]*href="([^"]*)"[^>]*>[^<]*<\/a>/gi, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&middot;/g, '·')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function sendTransactionalEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const resend = getResend();
  if (!resend) {
    const msg = '[EMAIL] Cannot send email: Resend not configured';
    console.error(msg, { to, subject });
    Sentry.captureMessage(msg, { level: 'error', extra: { to, subject } });
    return null;
  }

  try {
    const result = await resend.emails.send({
      from: 'NFI Report <noreply@nfireport.com>',
      replyTo: 'contact@nfireport.com',
      to,
      subject,
      html,
      text: htmlToPlainText(html),
      headers: {
        'List-Unsubscribe': '<mailto:contact@nfireport.com?subject=unsubscribe>',
      },
    });

    if (result.error) {
      console.error('[EMAIL] Resend API error:', result.error, { to, subject });
      Sentry.captureMessage('[EMAIL] Resend API error', {
        level: 'error',
        extra: { to, subject, error: result.error },
      });
      return null;
    }

    Sentry.captureMessage('[EMAIL] Sent successfully', {
      level: 'info',
      extra: { subject, id: result.data?.id },
    });
    return result;
  } catch (err) {
    console.error('[EMAIL] Failed to send:', err, { to, subject });
    Sentry.captureException(err, {
      tags: { context: 'email-send' },
      extra: { to, subject },
    });
    throw err;
  }
}

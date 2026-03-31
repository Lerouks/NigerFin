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
      to,
      subject,
      html,
    });

    if (result.error) {
      console.error('[EMAIL] Resend API error:', result.error, { to, subject });
      Sentry.captureMessage('[EMAIL] Resend API error', {
        level: 'error',
        extra: { to, subject, error: result.error },
      });
      return null;
    }

    console.log('[EMAIL] Sent successfully:', { to, subject, id: result.data?.id });
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

// Re-export Beehiiv functions for backward compatibility
export { subscribeToBeehiiv, syncContactToBeehiiv } from './beehiiv';

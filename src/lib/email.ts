import { Resend } from 'resend';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY!);
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
  return getResend().emails.send({
    from: 'NFI Report <noreply@nfireport.com>',
    to,
    subject,
    html,
  });
}

// Re-export Beehiiv functions for backward compatibility
export { subscribeToBeehiiv, syncContactToBeehiiv } from './beehiiv';

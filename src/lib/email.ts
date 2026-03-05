import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendTransactionalEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  return resend.emails.send({
    from: 'NFI Report <noreply@nfireport.ne>',
    to,
    subject,
    html,
  });
}

export async function subscribeToMailchimpNewsletter(email: string) {
  const apiKey = process.env.MAILCHIMP_API_KEY || '';
  const listId = process.env.MAILCHIMP_LIST_ID || '';
  const serverPrefix = process.env.MAILCHIMP_SERVER_PREFIX || 'us1';

  const response = await fetch(
    `https://${serverPrefix}.api.mailchimp.com/3.0/lists/${listId}/members`,
    {
      method: 'POST',
      headers: {
        Authorization: `apikey ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email_address: email,
        status: 'subscribed',
        tags: ['newsletter', 'nfi-report'],
      }),
    }
  );

  return response.ok;
}

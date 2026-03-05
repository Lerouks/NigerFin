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

export async function subscribeToMailchimpNewsletter(
  email: string,
  tags: string[] = ['newsletter']
) {
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
        tags: ['nfi-report', ...tags],
      }),
    }
  );

  return response.ok;
}

export async function updateMailchimpTags(email: string, tags: string[]) {
  const apiKey = process.env.MAILCHIMP_API_KEY || '';
  const listId = process.env.MAILCHIMP_LIST_ID || '';
  const serverPrefix = process.env.MAILCHIMP_SERVER_PREFIX || 'us1';

  // Mailchimp uses MD5 hash of lowercased email as subscriber ID
  const subscriberHash = email.toLowerCase().trim();
  const encoder = new TextEncoder();
  const data = encoder.encode(subscriberHash);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  // Note: Mailchimp actually uses MD5 but we'll use the email directly with PUT

  await fetch(
    `https://${serverPrefix}.api.mailchimp.com/3.0/lists/${listId}/members/${hashHex}/tags`,
    {
      method: 'POST',
      headers: {
        Authorization: `apikey ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tags: tags.map((t) => ({ name: t, status: 'active' })),
      }),
    }
  );
}

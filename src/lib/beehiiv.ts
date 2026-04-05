// Beehiiv newsletter management
// API docs: https://developers.beehiiv.com/api-reference/subscriptions

const API_KEY = process.env.BEEHIIV_API_KEY || '';
const PUBLICATION_ID = process.env.BEEHIIV_PUBLICATION_ID || '';
const BASE_URL = `https://api.beehiiv.com/v2/publications/${PUBLICATION_ID}`;

function getHeaders() {
  return {
    Authorization: `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  };
}

interface BeehiivSubscription {
  id: string;
  email: string;
  status: string;
  custom_fields?: { name: string; value: string }[];
}

interface ContactData {
  email: string;
  firstName?: string;
  role: string;
}

/**
 * Subscribe an email to the Beehiiv newsletter.
 * Used when someone subscribes via the newsletter form.
 */
export async function subscribeToBeehiiv(
  email: string,
  options: { sendWelcomeEmail?: boolean; utmSource?: string } = {}
): Promise<boolean> {
  if (!API_KEY || !PUBLICATION_ID) return false;

  try {
    const response = await fetch(`${BASE_URL}/subscriptions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        email,
        reactivate_existing: true,
        send_welcome_email: options.sendWelcomeEmail ?? false,
        utm_source: options.utmSource ?? 'nfireport',
        custom_fields: [
          { name: 'role', value: 'reader' },
        ],
      }),
    });

    return response.ok || response.status === 409; // 409 = already subscribed
  } catch {
    return false;
  }
}

/**
 * Sync a contact to Beehiiv with role-based custom fields.
 * Called on subscription changes (iPayMoney callback, admin actions, cron).
 */
export async function syncContactToBeehiiv(data: ContactData): Promise<boolean> {
  if (!API_KEY || !PUBLICATION_ID) return false;

  try {
    // First, try to find the existing subscription by email
    const existing = await getSubscriptionByEmail(data.email);

    if (existing) {
      // Update existing subscription with new custom fields
      const response = await fetch(`${BASE_URL}/subscriptions/${existing.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          custom_fields: [
            { name: 'role', value: data.role },
            { name: 'first_name', value: data.firstName || '' },
          ],
        }),
      });
      return response.ok;
    } else {
      // Create new subscription
      const response = await fetch(`${BASE_URL}/subscriptions`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          email: data.email,
          reactivate_existing: true,
          send_welcome_email: false,
          utm_source: 'nfireport',
          custom_fields: [
            { name: 'role', value: data.role },
            { name: 'first_name', value: data.firstName || '' },
          ],
        }),
      });
      return response.ok;
    }
  } catch {
    return false;
  }
}

/**
 * Get a Beehiiv subscription by email address.
 */
async function getSubscriptionByEmail(email: string): Promise<BeehiivSubscription | null> {
  if (!API_KEY || !PUBLICATION_ID) return null;

  try {
    const encodedEmail = encodeURIComponent(email);
    const response = await fetch(
      `${BASE_URL}/subscriptions/by_email/${encodedEmail}`,
      { headers: getHeaders() }
    );

    if (!response.ok) return null;

    const body = await response.json();
    return body.data ?? null;
  } catch {
    return null;
  }
}

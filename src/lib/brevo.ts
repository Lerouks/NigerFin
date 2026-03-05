// Mailchimp newsletter segmentation
// Uses existing Mailchimp config (MAILCHIMP_API_KEY, MAILCHIMP_LIST_ID, MAILCHIMP_SERVER_PREFIX)

import { createHash } from 'crypto';

const API_KEY = process.env.MAILCHIMP_API_KEY || '';
const LIST_ID = process.env.MAILCHIMP_LIST_ID || '';
const SERVER = process.env.MAILCHIMP_SERVER_PREFIX || 'us8';

function getMailchimpUrl(path: string) {
  return `https://${SERVER}.api.mailchimp.com/3.0${path}`;
}

function getHeaders() {
  return {
    Authorization: `apikey ${API_KEY}`,
    'Content-Type': 'application/json',
  };
}

function subscriberHash(email: string): string {
  return createHash('md5').update(email.toLowerCase()).digest('hex');
}

function getTagsForRole(role: string): string[] {
  const tags = ['nfi-report', role, 'newsletter_mensuelle'];

  if (role === 'standard' || role === 'pro') {
    tags.push('newsletter_hebdomadaire');
    tags.push('alertes_news');
  }

  if (role === 'pro') {
    tags.push('rapports_pdf');
  }

  return tags;
}

const ALL_ROLE_TAGS = ['reader', 'standard', 'pro', 'newsletter_hebdomadaire', 'alertes_news', 'rapports_pdf'];

interface ContactData {
  email: string;
  firstName?: string;
  role: string;
}

export async function syncContactToBrevo(data: ContactData): Promise<boolean> {
  if (!API_KEY || !LIST_ID) return false;

  try {
    const hash = subscriberHash(data.email);

    // Create or update the member
    await fetch(getMailchimpUrl(`/lists/${LIST_ID}/members/${hash}`), {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({
        email_address: data.email,
        status_if_new: 'subscribed',
        merge_fields: {
          FNAME: data.firstName || '',
          ROLE: data.role,
        },
      }),
    });

    // Remove old role tags, then add new ones
    const tagsToRemove = ALL_ROLE_TAGS.map((tag) => ({
      name: tag,
      status: 'inactive' as const,
    }));
    const tagsToAdd = getTagsForRole(data.role).map((tag) => ({
      name: tag,
      status: 'active' as const,
    }));

    await fetch(getMailchimpUrl(`/lists/${LIST_ID}/members/${hash}/tags`), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ tags: [...tagsToRemove, ...tagsToAdd] }),
    });

    return true;
  } catch {
    return false;
  }
}

export async function removeContactFromLists(_email: string, _listIds: number[]): Promise<void> {
  // Tags are managed via syncContactToBrevo — no separate list removal needed
}

export function getListIdsForRoleExport(_role: string): number[] {
  return [];
}

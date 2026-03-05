const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
const BREVO_API_URL = 'https://api.brevo.com/v3';

interface BrevoContactData {
  email: string;
  firstName?: string;
  role: string;
}

export async function syncContactToBrevo(data: BrevoContactData): Promise<boolean> {
  if (!BREVO_API_KEY) return false;

  try {
    await fetch(`${BREVO_API_URL}/contacts`, {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: data.email,
        attributes: {
          FIRSTNAME: data.firstName || '',
          ROLE: data.role,
        },
        listIds: getListIdsForRole(data.role),
        updateEnabled: true,
      }),
    });
    return true;
  } catch {
    return false;
  }
}

export async function removeContactFromLists(email: string, listIds: number[]): Promise<void> {
  if (!BREVO_API_KEY || listIds.length === 0) return;

  for (const listId of listIds) {
    try {
      await fetch(`${BREVO_API_URL}/contacts/lists/${listId}/contacts/remove`, {
        method: 'POST',
        headers: {
          'api-key': BREVO_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emails: [email] }),
      });
    } catch {}
  }
}

function getListIdsForRole(role: string): number[] {
  const ids: number[] = [];
  const monthly = parseInt(process.env.BREVO_LIST_MONTHLY || '0');
  const weekly = parseInt(process.env.BREVO_LIST_WEEKLY || '0');
  const alerts = parseInt(process.env.BREVO_LIST_ALERTS || '0');
  const pro = parseInt(process.env.BREVO_LIST_PRO || '0');

  if (monthly) ids.push(monthly); // All users get monthly

  if (role === 'standard' || role === 'pro') {
    if (weekly) ids.push(weekly);
    if (alerts) ids.push(alerts);
  }

  if (role === 'pro' && pro) {
    ids.push(pro);
  }

  return ids;
}

export function getListIdsForRoleExport(role: string): number[] {
  return getListIdsForRole(role);
}

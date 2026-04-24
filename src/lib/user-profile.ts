import type { UserRole } from '@/types';

// Track premium article read
export async function trackPremiumArticleRead(articleId: string, articleSlug: string): Promise<boolean> {
  try {
    const res = await fetch('/api/user/track-article', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleId, articleSlug }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function getRoleLabel(role: UserRole): string {
  switch (role) {
    case 'reader': return 'Lecteur';
    case 'premium': return 'Premium';
    case 'admin': return 'Administrateur';
    default: return 'Lecteur';
  }
}

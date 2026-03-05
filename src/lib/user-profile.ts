import type { UserProfile, UserRole } from '@/types';

// Fetch user profile from API
export async function fetchUserProfile(): Promise<UserProfile | null> {
  try {
    const res = await fetch('/api/user/profile');
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

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

// Get premium articles read this month count
export async function getPremiumArticlesCount(): Promise<number> {
  try {
    const res = await fetch('/api/user/premium-count');
    if (!res.ok) return 0;
    const data = await res.json();
    return data.count || 0;
  } catch {
    return 0;
  }
}

export function getRoleLabel(role: UserRole): string {
  switch (role) {
    case 'reader': return 'Lecteur';
    case 'standard': return 'Standard';
    case 'pro': return 'Pro';
    case 'admin': return 'Administrateur';
    default: return 'Lecteur';
  }
}

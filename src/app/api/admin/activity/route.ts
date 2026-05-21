import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';

interface ActivityEvent {
  id: string;
  type: 'payment' | 'comment' | 'signup' | 'article';
  initials?: string;
  label: string;
  detail: string;
  relativeTime: string;
  highlight?: string;
  occurredAt: string;
}

interface CommentRow {
  id: string;
  content: string | null;
  user_id: string | null;
  user_name: string | null;
  created_at: string;
}

export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const { serviceClient } = auth;
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  const [paymentsRes, commentsRes, signupsRes, articlesRes] = await Promise.all([
    serviceClient
      .from('payment_requests')
      .select('id, amount, user_id, verified_at, created_at, status, tier')
      .eq('status', 'verified')
      .gte('verified_at', since)
      .order('verified_at', { ascending: false })
      .limit(10),
    serviceClient
      .from('comments')
      .select('id, content, user_id, user_name, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(10),
    serviceClient
      .from('user_profiles')
      .select('id, full_name, email, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(10),
    serviceClient
      .from('articles')
      .select('id, title, published_at, status')
      .eq('status', 'published')
      .gte('published_at', since)
      .order('published_at', { ascending: false })
      .limit(5),
  ]);

  const events: ActivityEvent[] = [];

  // Récupère noms users pour paiements/commentaires
  const userIds = new Set<string>();
  for (const p of paymentsRes.data ?? []) if (p.user_id) userIds.add(p.user_id);
  for (const c of commentsRes.data ?? []) if (c.user_id) userIds.add(c.user_id);

  const profiles: Record<string, { full_name: string | null; email: string | null }> = {};
  if (userIds.size > 0) {
    const { data } = await serviceClient
      .from('user_profiles')
      .select('id, full_name, email')
      .in('id', Array.from(userIds));
    for (const p of data ?? []) profiles[p.id] = { full_name: p.full_name, email: p.email };
  }

  for (const p of paymentsRes.data ?? []) {
    const profile: { full_name: string | null; email: string | null } = profiles[p.user_id ?? ''] ?? { full_name: null, email: null };
    const displayName = profile.full_name || profile.email?.split('@')[0] || 'Un lecteur';
    events.push({
      id: `payment-${p.id}`,
      type: 'payment',
      initials: initialsFrom(displayName),
      label: displayName,
      detail: 'a souscrit Premium',
      relativeTime: relativeTime(p.verified_at ?? p.created_at),
      highlight: `+${(p.amount ?? 0).toLocaleString('fr-FR')} FCFA`,
      occurredAt: p.verified_at ?? p.created_at,
    });
  }

  for (const c of (commentsRes.data ?? []) as CommentRow[]) {
    const commentProfile: { full_name: string | null; email: string | null } = profiles[c.user_id ?? ''] ?? { full_name: null, email: null };
    const displayName =
      c.user_name ||
      commentProfile.full_name ||
      commentProfile.email?.split('@')[0] ||
      'Un lecteur';
    events.push({
      id: `comment-${c.id}`,
      type: 'comment',
      initials: initialsFrom(displayName),
      label: displayName,
      detail: 'a commenté',
      relativeTime: relativeTime(c.created_at),
      occurredAt: c.created_at,
    });
  }

  for (const s of signupsRes.data ?? []) {
    const displayName = s.full_name || s.email?.split('@')[0] || 'Nouveau lecteur';
    events.push({
      id: `signup-${s.id}`,
      type: 'signup',
      initials: initialsFrom(displayName),
      label: displayName,
      detail: "s'est inscrit",
      relativeTime: relativeTime(s.created_at),
      occurredAt: s.created_at,
    });
  }

  for (const a of articlesRes.data ?? []) {
    events.push({
      id: `article-${a.id}`,
      type: 'article',
      initials: 'AA',
      label: a.title,
      detail: 'a été publié',
      relativeTime: relativeTime(a.published_at),
      occurredAt: a.published_at,
    });
  }

  events.sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
  );

  return NextResponse.json({ events: events.slice(0, 8) });
}

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/);
  const a = parts[0]?.charAt(0) ?? '';
  const b = parts.length > 1 ? parts[parts.length - 1]!.charAt(0) : '';
  return (a + b).toUpperCase().slice(0, 2) || '••';
}

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  const diff = Math.max(0, Date.now() - date.getTime());
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'à l\'instant';
  const min = Math.floor(sec / 60);
  if (min < 60) return `il y a ${min} min`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'hier';
  if (days < 7) return `il y a ${days} j`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

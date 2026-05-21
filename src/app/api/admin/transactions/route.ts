import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';

interface TransactionUser {
  initials: string;
  displayName: string;
}

interface TransactionItem {
  id: string;
  amount: number;
  tier: string;
  billing_cycle: string;
  payment_method: string;
  verified_at: string | null;
  created_at: string;
  relativeTime: string;
  user: TransactionUser;
}

export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const { serviceClient } = auth;

  const { data: payments, error } = await serviceClient
    .from('payment_requests')
    .select('id, amount, tier, billing_cycle, payment_method, verified_at, created_at, user_id')
    .eq('status', 'verified')
    .order('verified_at', { ascending: false, nullsFirst: false })
    .limit(20);

  if (error) {
    return NextResponse.json(
      { error: 'Impossible de charger les transactions' },
      { status: 500 }
    );
  }

  const rows = payments ?? [];

  // Resolve display names via user_profiles
  const userIds = Array.from(
    new Set(rows.map((p) => p.user_id).filter((id): id is string => Boolean(id)))
  );

  const profiles: Record<string, { full_name: string | null; email: string | null }> = {};
  if (userIds.length > 0) {
    const { data: profileRows } = await serviceClient
      .from('user_profiles')
      .select('id, full_name, email')
      .in('id', userIds);
    for (const row of profileRows ?? []) {
      profiles[row.id] = { full_name: row.full_name, email: row.email };
    }
  }

  const transactions: TransactionItem[] = rows.map((p) => {
    const profile = (p.user_id && profiles[p.user_id]) || { full_name: null, email: null };
    const displayName =
      profile.full_name || profile.email?.split('@')[0] || 'Un lecteur';
    return {
      id: p.id,
      amount: p.amount,
      tier: p.tier,
      billing_cycle: p.billing_cycle,
      payment_method: p.payment_method,
      verified_at: p.verified_at,
      created_at: p.created_at,
      relativeTime: relativeTime(p.verified_at ?? p.created_at),
      user: {
        initials: initialsFrom(displayName),
        displayName,
      },
    };
  });

  return NextResponse.json({ transactions });
}

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.charAt(0) ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1]!.charAt(0) : '';
  return (first + last).toUpperCase().slice(0, 2) || '··';
}

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  const diff = Math.max(0, Date.now() - date.getTime());
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "à l'instant";
  const min = Math.floor(sec / 60);
  if (min < 60) return `il y a ${min} min`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'hier';
  if (days < 7) return `il y a ${days} j`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

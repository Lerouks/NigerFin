import { createServiceClient } from '@/lib/supabase';

export interface UpsertSubscriberInput {
  email: string;
  /** Where the user opted in (e.g. 'form', 'popup', 'signup', 'admin'). */
  source?: string;
  /** Optional auth user_id if the subscriber has an NFI account. */
  userId?: string;
  /** Locale for future i18n. Default: 'fr'. */
  locale?: string;
}

export interface UpsertSubscriberResult {
  id: string;
  /** True if this is a brand new subscriber. */
  isNew: boolean;
  /** True if a previously unsubscribed subscriber has been reactivated. */
  reactivated: boolean;
}

/**
 * Idempotent subscribe: creates a new newsletter_subscribers row, or reactivates
 * one that was previously unsubscribed, or no-ops if already active.
 *
 * Service-role only (bypasses RLS): callers must be server-side and trusted.
 */
export async function upsertNewsletterSubscriber(
  input: UpsertSubscriberInput,
): Promise<UpsertSubscriberResult> {
  const supabase = createServiceClient();
  if (!supabase) throw new Error('Supabase service client unavailable');

  const email = input.email.trim().toLowerCase();

  // Check existing
  const { data: existing, error: selErr } = await supabase
    .from('newsletter_subscribers')
    .select('id, status')
    .eq('email', email)
    .maybeSingle();

  if (selErr) {
    throw new Error(`Failed to lookup subscriber: ${selErr.message}`);
  }

  if (existing) {
    if (existing.status === 'active') {
      return { id: existing.id, isNew: false, reactivated: false };
    }

    // Reactivate previously unsubscribed/bounced/complained.
    const { error: updErr } = await supabase
      .from('newsletter_subscribers')
      .update({
        status: 'active',
        unsubscribed_at: null,
        opt_in_at: new Date().toISOString(),
        source: input.source ?? null,
        user_id: input.userId ?? null,
      })
      .eq('id', existing.id);

    if (updErr) {
      throw new Error(`Failed to reactivate subscriber: ${updErr.message}`);
    }

    return { id: existing.id, isNew: false, reactivated: true };
  }

  // Insert fresh
  const { data: created, error: insErr } = await supabase
    .from('newsletter_subscribers')
    .insert({
      email,
      source: input.source ?? null,
      user_id: input.userId ?? null,
      locale: input.locale ?? 'fr',
    })
    .select('id')
    .single();

  if (insErr || !created) {
    throw new Error(`Failed to insert subscriber: ${insErr?.message ?? 'unknown'}`);
  }

  return { id: created.id, isNew: true, reactivated: false };
}

export type SubscriberStatus =
  | 'active'
  | 'unsubscribed'
  | 'bounced'
  | 'complained';

export interface SubscriberRow {
  id: string;
  email: string;
  status: SubscriberStatus;
  source: string | null;
  user_id: string | null;
  opt_in_at: string;
  unsubscribed_at: string | null;
  locale: string;
  created_at: string;
}

export interface ListSubscribersInput {
  status?: SubscriberStatus | 'all';
  source?: string | 'all';
  /** Recherche partielle sur email (case-insensitive). */
  q?: string;
  page?: number;
  limit?: number;
}

export interface ListSubscribersResult {
  rows: SubscriberRow[];
  total: number;
}

export interface SubscriberStats {
  totalActive: number;
  totalUnsubscribed: number;
  totalBounced: number;
  totalComplained: number;
  newThisMonth: number;
  unsubscribedThisMonth: number;
  /** Breakdown des abonnés actifs par source. */
  bySource: { source: string; count: number }[];
}

/**
 * Liste paginée + filtrée des abonnés. Service-role only.
 */
export async function listSubscribers(
  input: ListSubscribersInput = {},
): Promise<ListSubscribersResult> {
  const supabase = createServiceClient();
  if (!supabase) return { rows: [], total: 0 };

  const page = Math.max(1, input.page ?? 1);
  const limit = Math.min(200, Math.max(1, input.limit ?? 50));
  const offset = (page - 1) * limit;

  let countQuery = supabase
    .from('newsletter_subscribers')
    .select('id', { count: 'exact', head: true });
  let dataQuery = supabase
    .from('newsletter_subscribers')
    .select(
      'id, email, status, source, user_id, opt_in_at, unsubscribed_at, locale, created_at',
    );

  if (input.status && input.status !== 'all') {
    countQuery = countQuery.eq('status', input.status);
    dataQuery = dataQuery.eq('status', input.status);
  }
  if (input.source && input.source !== 'all') {
    countQuery = countQuery.eq('source', input.source);
    dataQuery = dataQuery.eq('source', input.source);
  }
  if (input.q && input.q.trim()) {
    const q = input.q.trim().toLowerCase().slice(0, 100);
    const safe = q.replace(/[%_\\,]/g, ' ');
    countQuery = countQuery.ilike('email', `%${safe}%`);
    dataQuery = dataQuery.ilike('email', `%${safe}%`);
  }

  const [{ count }, { data }] = await Promise.all([
    countQuery,
    dataQuery
      .order('opt_in_at', { ascending: false })
      .range(offset, offset + limit - 1),
  ]);

  return {
    rows: (data ?? []) as SubscriberRow[],
    total: count ?? 0,
  };
}

/**
 * Statistiques agrégées (totaux par status + nouveautés du mois + breakdown source).
 */
export async function getSubscriberStats(): Promise<SubscriberStats> {
  const supabase = createServiceClient();
  if (!supabase) {
    return {
      totalActive: 0,
      totalUnsubscribed: 0,
      totalBounced: 0,
      totalComplained: 0,
      newThisMonth: 0,
      unsubscribedThisMonth: 0,
      bySource: [],
    };
  }

  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);
  const startOfMonthIso = startOfMonth.toISOString();

  const [
    activeCount,
    unsubCount,
    bouncedCount,
    complainedCount,
    newThisMonthCount,
    unsubThisMonthCount,
    sourceBreakdown,
  ] = await Promise.all([
    supabase
      .from('newsletter_subscribers')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active'),
    supabase
      .from('newsletter_subscribers')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'unsubscribed'),
    supabase
      .from('newsletter_subscribers')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'bounced'),
    supabase
      .from('newsletter_subscribers')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'complained'),
    supabase
      .from('newsletter_subscribers')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .gte('opt_in_at', startOfMonthIso),
    supabase
      .from('newsletter_subscribers')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'unsubscribed')
      .gte('unsubscribed_at', startOfMonthIso),
    supabase
      .from('newsletter_subscribers')
      .select('source')
      .eq('status', 'active'),
  ]);

  const counts = new Map<string, number>();
  for (const row of sourceBreakdown.data ?? []) {
    const key = (row as { source: string | null }).source ?? 'inconnu';
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const bySource = Array.from(counts.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalActive: activeCount.count ?? 0,
    totalUnsubscribed: unsubCount.count ?? 0,
    totalBounced: bouncedCount.count ?? 0,
    totalComplained: complainedCount.count ?? 0,
    newThisMonth: newThisMonthCount.count ?? 0,
    unsubscribedThisMonth: unsubThisMonthCount.count ?? 0,
    bySource,
  };
}

/**
 * Désabonner manuellement un abonné par son id (admin only).
 * Soft delete : on garde la ligne en status='unsubscribed' pour audit + anti-réinscription.
 */
export async function unsubscribeById(id: string): Promise<boolean> {
  const supabase = createServiceClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from('newsletter_subscribers')
    .update({
      status: 'unsubscribed',
      unsubscribed_at: new Date().toISOString(),
    })
    .eq('id', id);

  return !error;
}

/**
 * Mark a subscriber as unsubscribed (RFC 8058 one-click and standard flow).
 * Idempotent: no-op if already unsubscribed.
 */
export async function unsubscribeBy(
  field: 'email' | 'unsubscribe_token',
  value: string,
): Promise<{ found: boolean; alreadyUnsubscribed: boolean }> {
  const supabase = createServiceClient();
  if (!supabase) throw new Error('Supabase service client unavailable');

  const { data: existing } = await supabase
    .from('newsletter_subscribers')
    .select('id, status')
    .eq(field, value)
    .maybeSingle();

  if (!existing) return { found: false, alreadyUnsubscribed: false };
  if (existing.status === 'unsubscribed') {
    return { found: true, alreadyUnsubscribed: true };
  }

  await supabase
    .from('newsletter_subscribers')
    .update({
      status: 'unsubscribed',
      unsubscribed_at: new Date().toISOString(),
    })
    .eq('id', existing.id);

  return { found: true, alreadyUnsubscribed: false };
}

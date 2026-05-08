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

import { createServiceClient } from '@/lib/supabase';
import type { NewsletterIssue } from '@/emails/types';

export type NewsletterAudience = 'premium' | 'all' | 'free';
export type NewsletterStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';

export interface NewsletterIssueRow {
  id: string;
  number: number;
  slug: string;
  subject: string;
  preheader: string | null;
  audience: NewsletterAudience;
  content: NewsletterIssue;
  status: NewsletterStatus;
  scheduled_at: string | null;
  sent_at: string | null;
  recipients_count: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  bounced_count: number;
  unsubscribed_count: number;
  created_at: string;
  updated_at: string;
}

export function emptyContent(slug: string, number: number): NewsletterIssue {
  return {
    number,
    slug,
    subject: '',
    preheader: '',
    issueDateLabel: new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    readTimeMinutes: 7,
    intro: { heading: '', paragraph: '', summary: [] },
    market: { rows: [] },
    headlines: [],
  };
}

/**
 * Slug auto-généré court à partir du numéro et du sujet.
 * Convention : `001-or-brvm`, lowercase, sans accent.
 */
export function autoSlug(number: number, subject: string): string {
  const padded = String(number).padStart(3, '0');
  const tail = subject
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .split('-')
    .filter(Boolean)
    .slice(0, 4)
    .join('-');
  return tail ? `${padded}-${tail}` : padded;
}

export async function createDraft(input: {
  audience?: NewsletterAudience;
  subject?: string;
}): Promise<NewsletterIssueRow> {
  const supabase = createServiceClient();
  if (!supabase) throw new Error('Supabase service client unavailable');

  const subject = input.subject?.trim() || 'Nouveau numéro';

  // Predict next number to seed slug + content. Final number assigned by DB trigger.
  const { data: maxRow } = await supabase
    .from('newsletter_issues')
    .select('number')
    .order('number', { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextNumber = (maxRow?.number ?? 0) + 1;
  const slug = autoSlug(nextNumber, subject);
  const content = emptyContent(slug, nextNumber);

  const { data, error } = await supabase
    .from('newsletter_issues')
    .insert({
      slug,
      subject,
      audience: input.audience ?? 'premium',
      content: content as unknown as Record<string, unknown>,
      status: 'draft',
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`Failed to create draft: ${error?.message ?? 'unknown'}`);
  }

  return rowToTyped(data);
}

export async function getIssue(id: string): Promise<NewsletterIssueRow | null> {
  const supabase = createServiceClient();
  if (!supabase) throw new Error('Supabase service client unavailable');

  const { data, error } = await supabase
    .from('newsletter_issues')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch issue: ${error.message}`);
  if (!data) return null;
  return rowToTyped(data);
}

export interface UpdateIssueInput {
  subject?: string;
  preheader?: string | null;
  audience?: NewsletterAudience;
  content?: NewsletterIssue;
  status?: NewsletterStatus;
  scheduled_at?: string | null;
  slug?: string;
}

export async function updateIssue(
  id: string,
  input: UpdateIssueInput,
): Promise<NewsletterIssueRow> {
  const supabase = createServiceClient();
  if (!supabase) throw new Error('Supabase service client unavailable');

  const patch: Record<string, unknown> = {};
  if (input.subject !== undefined) patch.subject = input.subject;
  if (input.preheader !== undefined) patch.preheader = input.preheader;
  if (input.audience !== undefined) patch.audience = input.audience;
  if (input.content !== undefined) patch.content = input.content;
  if (input.status !== undefined) patch.status = input.status;
  if (input.scheduled_at !== undefined) patch.scheduled_at = input.scheduled_at;
  if (input.slug !== undefined) patch.slug = input.slug;

  const { data, error } = await supabase
    .from('newsletter_issues')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`Failed to update issue: ${error?.message ?? 'unknown'}`);
  }
  return rowToTyped(data);
}

export async function deleteIssue(id: string): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) throw new Error('Supabase service client unavailable');
  const { error } = await supabase.from('newsletter_issues').delete().eq('id', id);
  if (error) throw new Error(`Failed to delete issue: ${error.message}`);
}

export async function listIssues(filter?: {
  status?: NewsletterStatus | NewsletterStatus[];
  limit?: number;
}): Promise<NewsletterIssueRow[]> {
  const supabase = createServiceClient();
  if (!supabase) throw new Error('Supabase service client unavailable');

  let q = supabase.from('newsletter_issues').select('*').order('number', { ascending: false });
  if (filter?.status) {
    if (Array.isArray(filter.status)) q = q.in('status', filter.status);
    else q = q.eq('status', filter.status);
  }
  if (filter?.limit) q = q.limit(filter.limit);

  const { data, error } = await q;
  if (error) throw new Error(`Failed to list issues: ${error.message}`);
  return (data ?? []).map(rowToTyped);
}

interface RawRow {
  id: string;
  number: number;
  slug: string;
  subject: string;
  preheader: string | null;
  audience: string;
  content: unknown;
  status: string;
  scheduled_at: string | null;
  sent_at: string | null;
  recipients_count: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  bounced_count: number;
  unsubscribed_count: number;
  created_at: string;
  updated_at: string;
}

function rowToTyped(row: RawRow): NewsletterIssueRow {
  return {
    ...row,
    audience: row.audience as NewsletterAudience,
    status: row.status as NewsletterStatus,
    content: row.content as NewsletterIssue,
  };
}

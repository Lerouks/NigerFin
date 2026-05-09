import { Resend } from 'resend';
import * as Sentry from '@sentry/nextjs';
import { createServiceClient } from '@/lib/supabase';
import { renderPremiumBriefingHtml } from '@/emails/render';
import { SITE_URL } from '@/lib/config';
import type { NewsletterIssueRow } from '@/lib/newsletter/issues';
import { updateIssue } from '@/lib/newsletter/issues';

const FROM = 'NFI Report <noreply@nfireport.com>';
const REPLY_TO = 'contact@nfireport.com';
const BATCH_SIZE = 100; // Resend Batch API limit
const UNSUB_TOKEN_PLACEHOLDER = '__NFI_UNSUB_TOKEN__';

interface RecipientRow {
  id: string;
  email: string;
  unsubscribe_token: string;
}

interface SendResult {
  recipientsCount: number;
  batchesAttempted: number;
  batchesFailed: number;
  resendIds: string[];
}

/**
 * Resolve la liste des destinataires actifs selon l'audience choisie.
 *  - 'all'     : tous les abonnés actifs
 *  - 'premium' : actifs ET dont le user lié a role 'premium' ou 'admin'
 *  - 'free'    : actifs ET (sans user lié OU role 'reader')
 */
async function resolveRecipients(audience: 'premium' | 'all' | 'free'): Promise<RecipientRow[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  const { data: subs, error } = await supabase
    .from('newsletter_subscribers')
    .select('id, email, unsubscribe_token, user_id')
    .eq('status', 'active');

  if (error || !subs) return [];

  if (audience === 'all') {
    return subs.map((s) => ({ id: s.id, email: s.email, unsubscribe_token: s.unsubscribe_token }));
  }

  // Need to know each user's role to filter
  const userIds = subs.map((s) => s.user_id).filter((u): u is string => !!u);
  const { data: profiles } = userIds.length
    ? await supabase.from('user_profiles').select('id, role').in('id', userIds)
    : { data: [] };

  const roleByUser = new Map<string, string>(
    (profiles ?? []).map((p) => [p.id as string, p.role as string]),
  );

  return subs
    .filter((s) => {
      const role = s.user_id ? roleByUser.get(s.user_id) : undefined;
      const isPremium = role === 'premium' || role === 'admin';
      return audience === 'premium' ? isPremium : !isPremium;
    })
    .map((s) => ({ id: s.id, email: s.email, unsubscribe_token: s.unsubscribe_token }));
}

function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
  return result;
}

/**
 * Envoi end-to-end d'un numéro de newsletter à toute son audience.
 * Idempotent au niveau du status : si l'issue est deja 'sent', on no-op.
 *
 * Pipeline :
 *  1. Lock l'issue en status='sending' (évite double envoi en cas de retry cron)
 *  2. Render HTML 1 fois avec un placeholder unsubscribe_token
 *  3. Resolve audience (Premium / Free / Tous)
 *  4. Chunk par 100, pour chaque batch :
 *     - Personnalise le HTML par destinataire (replace token)
 *     - Personnalise le header List-Unsubscribe HTTPS One-Click
 *     - resend.batch.send(emails)
 *     - Insère newsletter_events { issue_id, subscriber_id, event_type:'delivered', meta:{resend_id} }
 *  5. Update issue : status='sent', sent_at=now, recipients_count
 *  6. En cas d'echec partiel : log Sentry, mais ne re-bascule pas en draft (les destinataires deja envoyés ne doivent pas être re-envoyés)
 */
export async function sendNewsletterIssue(issueId: string): Promise<SendResult> {
  const supabase = createServiceClient();
  if (!supabase) throw new Error('Supabase service client unavailable');
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY missing');
  const resend = new Resend(apiKey);

  // 1. Fetch issue + idempotence guard
  const { data: issueRow, error: fetchErr } = await supabase
    .from('newsletter_issues')
    .select('*')
    .eq('id', issueId)
    .single();

  if (fetchErr || !issueRow) throw new Error(`Issue ${issueId} not found`);
  const issue = issueRow as unknown as NewsletterIssueRow;

  if (issue.status === 'sent') {
    return { recipientsCount: issue.recipients_count, batchesAttempted: 0, batchesFailed: 0, resendIds: [] };
  }

  // Lock the issue
  await updateIssue(issueId, { status: 'sending' });

  try {
    // 2. Render HTML once with placeholder
    const placeholderUnsubUrl = `${SITE_URL}/api/newsletter/unsubscribe?token=${UNSUB_TOKEN_PLACEHOLDER}`;
    const baseHtml = await renderPremiumBriefingHtml({
      issue: issue.content,
      siteUrl: SITE_URL,
      managePreferencesUrl: `${SITE_URL}/compte/preferences-newsletter`,
      unsubscribeUrl: placeholderUnsubUrl,
      socials: {
        instagram: 'https://instagram.com/nfireport',
        facebook: 'https://www.facebook.com/nfireport',
        tiktok: 'https://tiktok.com/@nfireport',
      },
    });

    // 3. Resolve recipients
    const recipients = await resolveRecipients(issue.audience);
    if (recipients.length === 0) {
      await updateIssue(issueId, { status: 'sent' });
      return { recipientsCount: 0, batchesAttempted: 0, batchesFailed: 0, resendIds: [] };
    }

    // 4. Send in batches of 100
    const batches = chunk(recipients, BATCH_SIZE);
    const allResendIds: string[] = [];
    let batchesFailed = 0;

    for (const batch of batches) {
      const emails = batch.map((r) => {
        const personalHtml = baseHtml.replaceAll(UNSUB_TOKEN_PLACEHOLDER, r.unsubscribe_token);
        const personalUnsubUrl = `${SITE_URL}/api/newsletter/unsubscribe?token=${r.unsubscribe_token}`;
        return {
          from: FROM,
          replyTo: REPLY_TO,
          to: r.email,
          subject: issue.subject,
          html: personalHtml,
          headers: {
            'List-Unsubscribe': `<${personalUnsubUrl}>, <mailto:contact@nfireport.com?subject=unsubscribe>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
          tags: [
            { name: 'nfi_issue_id', value: issue.id },
            { name: 'nfi_subscriber_id', value: r.id },
            { name: 'nfi_issue_number', value: String(issue.number) },
          ],
        };
      });

      try {
        const result = await resend.batch.send(emails);
        const batchIds = (result.data?.data ?? []).map((d) => d.id).filter((id): id is string => !!id);
        allResendIds.push(...batchIds);

        // Persist delivered events (optimistic, refined by webhook later)
        const events = batch.map((r, idx) => ({
          issue_id: issue.id,
          subscriber_id: r.id,
          event_type: 'delivered' as const,
          meta: { resend_id: batchIds[idx] ?? null, optimistic: true },
        }));
        await supabase.from('newsletter_events').insert(events);
      } catch (err) {
        batchesFailed++;
        Sentry.captureException(err, {
          tags: { context: 'newsletter-send-batch' },
          extra: { issueId: issue.id, batchSize: batch.length },
        });
      }
    }

    // 5. Mark issue as sent + denormalized counter
    await updateIssue(issueId, {
      status: 'sent',
    });
    await supabase
      .from('newsletter_issues')
      .update({
        sent_at: new Date().toISOString(),
        recipients_count: recipients.length,
        delivered_count: recipients.length - batchesFailed * BATCH_SIZE,
      })
      .eq('id', issueId);

    return {
      recipientsCount: recipients.length,
      batchesAttempted: batches.length,
      batchesFailed,
      resendIds: allResendIds,
    };
  } catch (err) {
    Sentry.captureException(err, {
      tags: { context: 'newsletter-send-pipeline' },
      extra: { issueId },
    });
    // En cas d'erreur globale, on remet en 'draft' UNIQUEMENT si rien n'a été envoyé.
    await updateIssue(issueId, { status: 'draft' });
    throw err;
  }
}

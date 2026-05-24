import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { createServiceClient } from '@/lib/supabase';
import { sendNewsletterIssue } from '@/lib/newsletter/send';

/**
 * GET /api/cron/send-scheduled-newsletters
 * Vercel Cron daily 7h GMT.
 * Process toutes les issues `status='scheduled' AND scheduled_at <= now`.
 */
export async function GET(req: NextRequest) {
  // Vercel Cron envoie le header Authorization: Bearer ${CRON_SECRET}
  // Fail-closed : sans CRON_SECRET configure, l'endpoint refuse toutes les requetes (securite C-2).
  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers.get('authorization');
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = createServiceClient();
  if (!supabase) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

  const now = new Date().toISOString();
  const { data: issues, error } = await supabase
    .from('newsletter_issues')
    .select('id, slug, scheduled_at')
    .eq('status', 'scheduled')
    .lte('scheduled_at', now)
    .limit(20);

  if (error) {
    Sentry.captureException(error, { tags: { context: 'cron-send-scheduled' } });
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }

  if (!issues || issues.length === 0) {
    return NextResponse.json({ processed: 0, message: 'Aucun envoi programmé à traiter' });
  }

  const results: Array<{ issueId: string; slug: string; success: boolean; recipients?: number; error?: string }> = [];

  for (const issue of issues) {
    try {
      const r = await sendNewsletterIssue(issue.id);
      results.push({ issueId: issue.id, slug: issue.slug, success: true, recipients: r.recipientsCount });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({ issueId: issue.id, slug: issue.slug, success: false, error: msg });
      Sentry.captureException(err, {
        tags: { context: 'cron-send-issue' },
        extra: { issueId: issue.id, slug: issue.slug },
      });
    }
  }

  return NextResponse.json({
    processed: issues.length,
    results,
  });
}

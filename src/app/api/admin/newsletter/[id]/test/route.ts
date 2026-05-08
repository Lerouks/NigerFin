import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { requireAdmin } from '@/lib/admin-auth';
import { isValidUUID, safeParseJSON, isValidEmail } from '@/lib/validation';
import { serverError } from '@/lib/api-error';
import { getIssue } from '@/lib/newsletter/issues';
import { renderPremiumBriefingHtml } from '@/emails/render';
import { sendTransactionalEmail } from '@/lib/email';
import { SITE_URL } from '@/lib/config';

interface Params { id: string; }

/**
 * POST /api/admin/newsletter/:id/test
 * Body : { to?: string }   (default = current admin email)
 * Sends the rendered newsletter to a single address for QA. Admin only.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<Params> }) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;
    const { user } = auth;
    const { id } = await ctx.params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Identifiant invalide' }, { status: 400 });
    }

    const body = (await safeParseJSON(req)) as { to?: string } | null;
    const to = body?.to && isValidEmail(body.to) ? body.to : user.email;
    if (!to || !isValidEmail(to)) {
      return NextResponse.json({ error: 'Adresse e-mail destinataire invalide' }, { status: 400 });
    }

    const issue = await getIssue(id);
    if (!issue) {
      return NextResponse.json({ error: 'Numéro introuvable' }, { status: 404 });
    }

    const html = await renderPremiumBriefingHtml({
      issue: issue.content,
      siteUrl: SITE_URL,
      managePreferencesUrl: `${SITE_URL}/compte/preferences-newsletter`,
      unsubscribeUrl: `${SITE_URL}/api/newsletter/unsubscribe?token=TEST`,
      socials: {
        instagram: 'https://instagram.com/nfireport',
        facebook: 'https://facebook.com/nfireport',
        linkedin: 'https://linkedin.com/company/nfireport',
        tiktok: 'https://tiktok.com/@nfireport',
      },
    });

    const result = await sendTransactionalEmail({
      to,
      subject: `[TEST] ${issue.subject || 'Premium Briefing'}`,
      html,
    });

    if (!result) {
      Sentry.captureMessage('Newsletter test send returned null', {
        level: 'warning',
        extra: { issueId: id, to },
      });
      return NextResponse.json({ error: "Échec d'envoi (Resend non configuré)" }, { status: 500 });
    }

    return NextResponse.json({ success: true, sentTo: to });
  } catch (err) {
    return serverError(err, 'admin-newsletter-test');
  }
}

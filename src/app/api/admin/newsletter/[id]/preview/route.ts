import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { isValidUUID } from '@/lib/validation';
import { serverError } from '@/lib/api-error';
import { getIssue } from '@/lib/newsletter/issues';
import { renderPremiumBriefingHtml } from '@/emails/render';
import { SITE_URL } from '@/lib/config';

interface Params { id: string; }

/**
 * GET /api/admin/newsletter/:id/preview
 * Returns the rendered HTML of the issue, suitable for an iframe preview.
 * Admin only.
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<Params> }) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;
    const { id } = await ctx.params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Identifiant invalide' }, { status: 400 });
    }

    const issue = await getIssue(id);
    if (!issue) {
      return NextResponse.json({ error: 'Numéro introuvable' }, { status: 404 });
    }

    const html = await renderPremiumBriefingHtml({
      issue: issue.content,
      siteUrl: SITE_URL,
      managePreferencesUrl: `${SITE_URL}/compte/preferences-newsletter`,
      unsubscribeUrl: `${SITE_URL}/api/newsletter/unsubscribe?token=PREVIEW`,
      socials: {
        instagram: 'https://instagram.com/nfireport',
        facebook: 'https://facebook.com/nfireport',
        tiktok: 'https://tiktok.com/@nfireport',
      },
    });

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'private, no-store',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    });
  } catch (err) {
    return serverError(err, 'admin-newsletter-preview');
  }
}

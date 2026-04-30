import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { renderPremiumBriefingHtml } from '@/emails/render';
import { getDemoIssue } from '@/data/newsletter-issues';
import { SITE_URL } from '@/lib/config';

export const dynamic = 'force-dynamic';

/**
 * GET /api/newsletter/premium/preview?issue=<slug>&format=html|text
 *
 * Renvoie le HTML rendu de la newsletter pour un slug donné.
 * Réservé aux admins (RLS via requireAdmin).
 */
export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;

  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('issue') ?? '001-demo';
  const format = searchParams.get('format') ?? 'html';

  const issue = getDemoIssue(slug);
  if (!issue) {
    return NextResponse.json({ error: `Numéro introuvable : ${slug}` }, { status: 404 });
  }

  if (format === 'json') {
    return NextResponse.json(issue);
  }

  const html = await renderPremiumBriefingHtml({
    issue,
    siteUrl: SITE_URL,
    managePreferencesUrl: `${SITE_URL}/compte`,
    unsubscribeUrl: `${SITE_URL}/compte`,
    socials: {
      instagram: 'https://www.instagram.com/nfireport',
      facebook: 'https://www.facebook.com/nfireport',
    },
  });

  if (format === 'text') {
    const { renderPremiumBriefingText } = await import('@/emails/render');
    const text = renderPremiumBriefingText(issue, SITE_URL);
    return new NextResponse(text, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

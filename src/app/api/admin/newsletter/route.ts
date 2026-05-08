import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { safeParseJSON } from '@/lib/validation';
import { serverError } from '@/lib/api-error';
import { createDraft, type NewsletterAudience } from '@/lib/newsletter/issues';

const VALID_AUDIENCES: NewsletterAudience[] = ['premium', 'all', 'free'];

/**
 * POST /api/admin/newsletter
 * Creates a new draft and returns its id+slug.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    const body = (await safeParseJSON(request)) as { audience?: string; subject?: string } | null;
    const audience = body?.audience && VALID_AUDIENCES.includes(body.audience as NewsletterAudience)
      ? (body.audience as NewsletterAudience)
      : 'premium';

    const draft = await createDraft({ audience, subject: body?.subject });

    return NextResponse.json({ id: draft.id, slug: draft.slug, number: draft.number });
  } catch (err) {
    return serverError(err, 'admin-newsletter-create');
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin-auth';
import * as Sentry from '@sentry/nextjs';

// POST: set a single article as featured (atomic)
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const { serviceClient } = auth;
  const body = await req.json();
  const { articleId } = body;

  if (!articleId) {
    return NextResponse.json({ error: 'Missing articleId' }, { status: 400 });
  }

  // Use the RPC function for atomic operation
  const { error } = await serviceClient.rpc('set_featured_article', {
    target_article_id: articleId,
  });

  if (error) {
    Sentry.captureException(error, { tags: { context: 'admin-featured-set' }, extra: { articleId } });
    return NextResponse.json({ error: 'Erreur lors de la mise à la une' }, { status: 500 });
  }

  // Immediately revalidate homepage so featured change is visible
  revalidatePath('/');

  return NextResponse.json({ success: true });
}

// DELETE: unfeature an article. Zero featured = no hero section displayed on /,
// la home a un fallback propre (ticker marchés + dernières actualités prennent
// alors le relais visuel).
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const { serviceClient } = auth;
  const { searchParams } = new URL(req.url);
  const articleId = searchParams.get('articleId');

  if (!articleId) {
    return NextResponse.json({ error: 'Missing articleId' }, { status: 400 });
  }

  const { error } = await serviceClient.rpc('unfeature_article', {
    target_article_id: articleId,
  });

  if (error) {
    Sentry.captureException(error, { tags: { context: 'admin-featured-unset' }, extra: { articleId } });
    return NextResponse.json({ error: 'Erreur lors du retrait de la une' }, { status: 500 });
  }

  revalidatePath('/');

  return NextResponse.json({ success: true });
}

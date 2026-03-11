import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin-auth';

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Immediately revalidate homepage so featured change is visible
  revalidatePath('/');

  return NextResponse.json({ success: true });
}

// DELETE: unfeature an article (with warning check)
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const { serviceClient } = auth;
  const { searchParams } = new URL(req.url);
  const articleId = searchParams.get('articleId');

  if (!articleId) {
    return NextResponse.json({ error: 'Missing articleId' }, { status: 400 });
  }

  // Check how many featured articles exist
  const { count } = await serviceClient
    .from('articles')
    .select('*', { count: 'exact', head: true })
    .eq('is_featured', true);

  if ((count || 0) <= 1) {
    return NextResponse.json(
      { error: 'Impossible de retirer le seul article à la une. Choisissez d\'abord un autre article.' },
      { status: 400 }
    );
  }

  const { error } = await serviceClient.rpc('unfeature_article', {
    target_article_id: articleId,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath('/');

  return NextResponse.json({ success: true });
}

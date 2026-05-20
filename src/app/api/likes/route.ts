import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { createServerSupabaseClient } from '@/lib/supabase';
import { isValidUUID, safeParseJSON } from '@/lib/validation';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  const articleId = request.nextUrl.searchParams.get('article_id');
  if (!articleId || !isValidUUID(articleId)) {
    return NextResponse.json({ error: 'article_id invalide (UUID requis)' }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ count: 0, isLiked: false });
  }

  // Optimized: get count and user like status in parallel
  const { data: { user } } = await supabase.auth.getUser();

  const countPromise = supabase
    .from('article_likes')
    .select('*', { count: 'exact', head: true })
    .eq('article_id', articleId);

  const userLikePromise = user
    ? supabase
        .from('article_likes')
        .select('id')
        .eq('article_id', articleId)
        .eq('user_id', user.id)
        .maybeSingle()
    : Promise.resolve({ data: null });

  const [countResult, userLikeResult] = await Promise.all([countPromise, userLikePromise]);

  return NextResponse.json({
    count: countResult.count || 0,
    isLiked: !!userLikeResult.data,
  });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Rate limit: 30 likes per minute per user
    const rl = await checkRateLimit(`likes:${user.id}`, RATE_LIMITS.likes.limit, RATE_LIMITS.likes.windowMs);
    if (rl.limited) {
      return NextResponse.json({ error: 'Trop de requêtes. Réessayez plus tard.' }, { status: 429 });
    }

    const body = await safeParseJSON(request);
    if (!body) {
      return NextResponse.json({ error: 'Corps de requête JSON invalide' }, { status: 400 });
    }

    const { article_id } = body as { article_id?: string };
    if (!article_id || !isValidUUID(article_id)) {
      return NextResponse.json({ error: 'article_id invalide (UUID requis)' }, { status: 400 });
    }

    // Check if already liked
    const { data: existing } = await supabase
      .from('article_likes')
      .select('id')
      .eq('article_id', article_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      // Unlike : on capture l'erreur Supabase pour Sentry sinon la suppression
      // peut echouer silencieusement (audit 2026-05-20)
      const { error: deleteError } = await supabase
        .from('article_likes')
        .delete()
        .eq('id', existing.id);
      if (deleteError) {
        Sentry.captureException(deleteError, {
          tags: { context: 'likes-api', op: 'unlike' },
          extra: { article_id, user_id: user.id },
        });
        return NextResponse.json({ error: 'Erreur suppression like' }, { status: 500 });
      }
      return NextResponse.json({ liked: false });
    } else {
      // Like
      const { error: insertError } = await supabase
        .from('article_likes')
        .insert({ article_id, user_id: user.id });
      if (insertError) {
        Sentry.captureException(insertError, {
          tags: { context: 'likes-api', op: 'like' },
          extra: { article_id, user_id: user.id },
        });
        return NextResponse.json({ error: 'Erreur création like' }, { status: 500 });
      }
      return NextResponse.json({ liked: true });
    }
  } catch (err) {
    Sentry.captureException(err, { tags: { context: 'likes-api' } });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

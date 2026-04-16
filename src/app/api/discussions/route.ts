import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { serverError } from '@/lib/api-error';
import { parsePagination, paginatedResponse } from '@/lib/pagination';
import { safeParseJSON } from '@/lib/validation';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get('category');
  const params = parsePagination(request.nextUrl.searchParams);

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json(paginatedResponse([], 0, params));
  }

  // Count query
  let countQuery = supabase
    .from('discussions')
    .select('*', { count: 'exact', head: true });
  if (category) countQuery = countQuery.eq('category', category);
  const { count } = await countQuery;

  // Data query with pagination
  let query = supabase
    .from('discussions')
    .select('*, discussion_comments(count)')
    .order('created_at', { ascending: false })
    .range(params.offset, params.offset + params.limit - 1);

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;

  if (error) {
    return serverError(error, 'discussions');
  }

  return NextResponse.json(paginatedResponse(data || [], count || 0, params));
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

    // Rate limit: 5 discussions per 10 minutes per user
    const rl = await checkRateLimit(`discussions:${user.id}`, RATE_LIMITS.discussions.limit, RATE_LIMITS.discussions.windowMs);
    if (rl.limited) {
      return NextResponse.json({ error: 'Trop de discussions créées. Réessayez plus tard.' }, { status: 429 });
    }

    const body = await safeParseJSON(request);
    if (!body) {
      return NextResponse.json({ error: 'Corps de requête JSON invalide' }, { status: 400 });
    }

    const { title, content, category } = body as { title?: string; content?: string; category?: string };

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'title and content required' }, { status: 400 });
    }

    if (title.trim().length > 200) {
      return NextResponse.json({ error: 'Titre trop long (max 200 caractères)' }, { status: 400 });
    }

    if (content.trim().length > 10000) {
      return NextResponse.json({ error: 'Contenu trop long (max 10000 caractères)' }, { status: 400 });
    }

    const username = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Utilisateur';

    const { data, error } = await supabase
      .from('discussions')
      .insert({
        title: title.trim(),
        content: content.trim(),
        user_id: user.id,
        username,
        category: category || 'general',
      })
      .select()
      .single();

    if (error) {
      return serverError(error, 'discussions');
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

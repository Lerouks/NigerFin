import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { parsePagination, paginatedResponse } from '@/lib/pagination';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const params = parsePagination(request.nextUrl.searchParams);

  const { count } = await supabase
    .from('article_likes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const { data } = await supabase
    .from('article_likes')
    .select('article_id, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(params.offset, params.offset + params.limit - 1);

  return NextResponse.json(paginatedResponse(data || [], count || 0, params));
}

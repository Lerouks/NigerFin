import { NextRequest, NextResponse } from 'next/server';
import { searchArticles } from '@/lib/articles';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  const ip = getClientIP(request);
  const rl = await checkRateLimit(`search:${ip}`, 30, 60 * 1000);
  if (rl.limited) {
    return NextResponse.json({ error: 'Trop de recherches. Réessayez dans un instant.' }, { status: 429 });
  }

  const q = request.nextUrl.searchParams.get('q') || '';
  if (q.trim().length < 2) {
    return NextResponse.json({ data: [] });
  }

  const articles = await searchArticles(q, 30);
  return NextResponse.json({ data: articles });
}

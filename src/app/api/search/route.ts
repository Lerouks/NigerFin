import { NextRequest, NextResponse } from 'next/server';
import { searchArticles } from '@/lib/articles';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') || '';
  if (q.trim().length < 2) {
    return NextResponse.json({ data: [] });
  }

  const articles = await searchArticles(q, 30);
  return NextResponse.json({ data: articles });
}

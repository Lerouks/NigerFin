import { NextRequest, NextResponse } from 'next/server';
import { getAllArticles } from '@/lib/articles';
import { parsePagination, paginatedResponse } from '@/lib/pagination';

export async function GET(request: NextRequest) {
  const params = parsePagination(request.nextUrl.searchParams);
  const { articles, total } = await getAllArticles(params.page, params.limit);
  return NextResponse.json(paginatedResponse(articles, total, params));
}

import { NextResponse } from 'next/server';
import { getAllArticles } from '@/lib/articles';

export async function GET() {
  const articles = await getAllArticles();
  return NextResponse.json(articles);
}

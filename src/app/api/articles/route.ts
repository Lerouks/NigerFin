import { NextResponse } from 'next/server';
import { getAllArticles } from '@/lib/sanity';

export async function GET() {
  const articles = await getAllArticles();
  return NextResponse.json(articles);
}

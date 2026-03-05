import { NextResponse } from 'next/server';
import { getAllArticles } from '@/lib/sanity';
import { mockArticles } from '@/data/mock-data';

export async function GET() {
  const sanityArticles = await getAllArticles();
  const articles = sanityArticles.length > 0 ? sanityArticles : mockArticles;
  return NextResponse.json(articles);
}

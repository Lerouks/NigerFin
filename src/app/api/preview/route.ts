import { NextRequest, NextResponse } from 'next/server';
import { draftMode } from 'next/headers';

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  const slug = request.nextUrl.searchParams.get('slug');

  if (secret !== process.env.SANITY_PREVIEW_SECRET) {
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
  }

  if (!slug) {
    return NextResponse.json({ message: 'Slug required' }, { status: 400 });
  }

  const draft = await draftMode();
  draft.enable();

  return NextResponse.redirect(new URL(`/articles/${slug}`, request.url));
}

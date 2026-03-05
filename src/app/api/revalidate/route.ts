import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

// On-demand cache revalidation endpoint
// Called after article creation/update/deletion from admin
export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');

  if (secret !== process.env.SANITY_REVALIDATE_SECRET) {
    return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
  }

  let body: { type?: string; slug?: string } = {};
  try {
    body = await request.json();
  } catch {}

  const revalidated: string[] = [];

  // Always revalidate homepage
  revalidatePath('/');
  revalidated.push('/');

  if (body.type === 'article') {
    if (body.slug) {
      revalidatePath(`/articles/${body.slug}`);
      revalidated.push(`/articles/${body.slug}`);
    }
    for (const cat of ['/economie', '/finance', '/entreprises', '/education', '/marches']) {
      revalidatePath(cat);
      revalidated.push(cat);
    }
  }

  return NextResponse.json({ revalidated: true, paths: revalidated, now: Date.now() });
}

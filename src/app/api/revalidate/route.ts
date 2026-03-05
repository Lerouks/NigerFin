import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

// Sanity webhook → Next.js on-demand revalidation
//
// HOW TO CONFIGURE IN SANITY DASHBOARD:
// 1. Go to https://www.sanity.io/manage → your project → API → Webhooks
// 2. Create a new webhook:
//    - Name: "Next.js Revalidation"
//    - URL: https://YOUR_DOMAIN/api/revalidate
//    - Trigger on: Create, Update, Delete
//    - Filter: _type == "article" || _type == "breakingNews" || _type == "siteSettings" || _type == "tool" || _type == "page" || _type == "legalPage"
//    - Projection: {_type, slug}
//    - Secret: same value as SANITY_REVALIDATE_SECRET env var
// 3. Save and test

interface SanityWebhookBody {
  _type?: string;
  slug?: { current?: string };
}

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');

  if (secret !== process.env.SANITY_REVALIDATE_SECRET) {
    return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
  }

  let body: SanityWebhookBody = {};
  try {
    body = await request.json();
  } catch {
    // Empty body is OK for delete events
  }

  const type = body._type;
  const slug = body.slug?.current;

  // Revalidate based on content type
  const revalidated: string[] = [];

  // Always revalidate homepage (it shows latest articles)
  revalidatePath('/');
  revalidated.push('/');

  if (type === 'article') {
    // Revalidate the specific article page
    if (slug) {
      revalidatePath(`/articles/${slug}`);
      revalidated.push(`/articles/${slug}`);
    }
    // Revalidate all category pages (article could change category)
    for (const cat of ['/economie', '/finance', '/entreprises', '/education', '/marches']) {
      revalidatePath(cat);
      revalidated.push(cat);
    }
  }

  if (type === 'breakingNews') {
    // Breaking news appears on layout — revalidate all
    revalidatePath('/', 'layout');
    revalidated.push('layout:/');
  }

  if (type === 'siteSettings') {
    revalidatePath('/', 'layout');
    revalidated.push('layout:/');
  }

  if (type === 'tool') {
    revalidatePath('/outils');
    revalidated.push('/outils');
  }

  if (type === 'page' && slug) {
    revalidatePath(`/${slug}`);
    revalidated.push(`/${slug}`);
  }

  if (type === 'legalPage' && slug) {
    revalidatePath(`/legal/${slug}`);
    revalidated.push(`/legal/${slug}`);
  }

  return NextResponse.json({
    revalidated: true,
    paths: revalidated,
    now: Date.now(),
  });
}

import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { verifyBearerSecret } from '@/lib/secret-compare';

// On-demand cache revalidation endpoint
// Called after article creation/update/deletion from admin
//
// Authentification : header `Authorization: Bearer <REVALIDATE_SECRET>`.
// Le secret n'est PLUS accepte en query string, qui etait logge en clair
// par Vercel function logs (durcissement audit securite 2026-05-20).
export async function POST(request: NextRequest) {
  if (!verifyBearerSecret(request.headers.get('authorization'), process.env.REVALIDATE_SECRET)) {
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

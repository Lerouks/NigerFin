import { NextResponse } from 'next/server';
import { draftMode } from 'next/headers';
import { SITE_URL } from '@/lib/config';

export async function GET() {
  const draft = await draftMode();
  draft.disable();
  return NextResponse.redirect(new URL('/', SITE_URL));
}

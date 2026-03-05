import { NextResponse } from 'next/server';
import { draftMode } from 'next/headers';

export async function GET() {
  const draft = await draftMode();
  draft.disable();
  return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_SITE_URL || 'https://nfireport.com'));
}

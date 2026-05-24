import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { EmailOtpType } from '@supabase/supabase-js';
import * as Sentry from '@sentry/nextjs';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const defaultNext = type === 'signup' ? '/inscription/completer-profil' : '/';
  const next = searchParams.get('next') ?? defaultNext;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (token_hash && type && supabaseUrl && supabaseKey) {
    const redirectResponse = NextResponse.redirect(`${origin}${next}`);

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            redirectResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    try {
      const { error } = await supabase.auth.verifyOtp({ token_hash, type });

      if (!error) {
        redirectResponse.headers.set('Cache-Control', 'no-store, max-age=0');
        return redirectResponse;
      }

      Sentry.captureMessage('OTP verification failed', {
        level: 'warning',
        tags: { context: 'auth-confirm-otp' },
        extra: { errorMessage: error.message },
      });
    } catch (err) {
      Sentry.captureException(err, { tags: { context: 'auth-confirm-verify' } });
    }
  }

  return NextResponse.redirect(`${origin}/connexion?error=auth`);
}

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { EmailOtpType } from '@supabase/supabase-js';
import * as Sentry from '@sentry/nextjs';
import { safeNextPath } from '@/lib/validation';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const defaultNext = type === 'signup' ? '/inscription/completer-profil' : '/';
  // « next » vient d'un lien que n'importe qui peut fabriquer : seul un chemin
  // du site est suivi, sinon l'accueil. Sans ce filtre, next=@evil.com donnait
  // https://nfireport.com@evil.com, c'est-à-dire evil.com, juste après la
  // confirmation.
  const next = safeNextPath(searchParams.get('next') ?? defaultNext);

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

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { safeNextPath } from '@/lib/validation';
import { envoyerBienvenueSiNouveau } from '@/lib/auth/bienvenue';
import * as Sentry from '@sentry/nextjs';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeNextPath(searchParams.get('next'));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (code && supabaseUrl && supabaseKey) {
    const supabaseResponse = NextResponse.redirect(`${origin}${next}`);

    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    let exchangeError: Error | null = null;
    let data: { user: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null; session: unknown } | null = null;

    try {
      const result = await supabase.auth.exchangeCodeForSession(code);
      exchangeError = result.error;
      data = result.data;
    } catch (err) {
      // Sec H-5 : on n'imprime pas l'erreur brute (peut contenir PKCE verifier ou tokens
      // d'un debug Supabase). Sentry reste capture pour suivi.
      Sentry.captureException(err, { tags: { context: 'auth-callback-exchange' } });
      return NextResponse.redirect(`${origin}/connexion?error=auth`);
    }

    if (!exchangeError) {
      // Send welcome email for newly confirmed users
      if (data?.user) {
        const userId = data.user.id;
        envoyerBienvenueSiNouveau(userId, data.user.email, data.user.user_metadata?.full_name as string | undefined).catch((err) => {
          Sentry.captureException(err, { tags: { context: 'welcome-email' }, extra: { userId } });
        });
      }
      // Prevent caching of auth callback responses
      supabaseResponse.headers.set('Cache-Control', 'no-store, max-age=0');
      return supabaseResponse;
    }
  }

  return NextResponse.redirect(`${origin}/connexion?error=auth`);
}

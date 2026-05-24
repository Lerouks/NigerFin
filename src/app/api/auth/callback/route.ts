import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { sendTransactionalEmail } from '@/lib/email';
import { welcomeSignupEmail } from '@/lib/email-templates';
import { createServiceClient } from '@/lib/supabase';
import { safeNextPath } from '@/lib/validation';
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
      console.error('[AUTH CALLBACK] Code exchange failed:', err);
      Sentry.captureException(err, { tags: { context: 'auth-callback-exchange' } });
      return NextResponse.redirect(`${origin}/connexion?error=auth`);
    }

    if (!exchangeError) {
      // Send welcome email for newly confirmed users
      if (data?.user) {
        const userId = data.user.id;
        sendWelcomeIfNew(userId, data.user.email, data.user.user_metadata?.full_name as string | undefined).catch((err) => {
          console.error('[EMAIL] Welcome email failed:', err);
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

async function sendWelcomeIfNew(userId: string, email?: string, fullName?: string) {
  if (!email) return;

  const service = createServiceClient();
  if (!service) return;

  // Check if the profile was just created (no welcome_sent flag)
  const { data: profile } = await service
    .from('user_profiles')
    .select('welcome_email_sent')
    .eq('id', userId)
    .single();

  // Only send once, skip if already sent or column doesn't exist
  if (profile?.welcome_email_sent) return;

  const welcome = welcomeSignupEmail(fullName || 'Client');
  await sendTransactionalEmail({ to: email, ...welcome });

  // Mark as sent (ignore error if column doesn't exist)
  try {
    await service
      .from('user_profiles')
      .update({ welcome_email_sent: true } as Record<string, unknown>)
      .eq('id', userId);
  } catch {
    // Column may not exist yet
  }
}

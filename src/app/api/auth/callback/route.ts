import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { sendTransactionalEmail } from '@/lib/email';
import { welcomeSignupEmail } from '@/lib/email-templates';
import { createServiceClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabaseResponse = NextResponse.redirect(`${origin}${next}`);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Send welcome email for newly confirmed users
      if (data?.user) {
        sendWelcomeIfNew(data.user.id, data.user.email, data.user.user_metadata?.full_name).catch(() => {});
      }
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

  // Only send once — skip if already sent or column doesn't exist
  if (profile?.welcome_email_sent) return;

  const welcome = welcomeSignupEmail(fullName || 'Client');
  await sendTransactionalEmail({ to: email, ...welcome });

  // Mark as sent (ignore error if column doesn't exist)
  try {
    await service
      .from('user_profiles')
      .update({ welcome_email_sent: true } as any)
      .eq('id', userId);
  } catch {
    // Column may not exist yet
  }
}

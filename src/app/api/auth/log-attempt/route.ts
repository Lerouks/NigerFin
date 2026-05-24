import { NextResponse, type NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/rate-limit';
import { safeParseJSON, isValidEmail } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request);

    // Persistent rate limit: 10 per 15 minutes per IP
    const rl = await checkRateLimit(`auth-log:${ip}`, RATE_LIMITS.auth.limit, RATE_LIMITS.auth.windowMs);
    if (rl.limited) {
      return NextResponse.json({ ok: true }); // Silently drop
    }

    const body = await safeParseJSON(request);
    if (!body) {
      return NextResponse.json({ ok: true }); // Silently drop bad requests
    }

    const { type, email } = body as { type?: string; email?: string };

    // LOW-SEC-3 : on retourne 200 silencieusement (au lieu de 400 avec message)
    // pour ne pas leak l'existence/le schema de cet endpoint au scanner.
    // Tout l'endpoint suit ce pattern fail-silent : ne JAMAIS donner d'info au
    // scanner sur ce qui a marche ou non.
    if (!type || !email || !isValidEmail(email)) {
      return NextResponse.json({ ok: true });
    }

    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ ok: true }); // Fail silently if not configured
    }

    // Log to auth_attempts table
    await supabase.from('auth_attempts').insert({
      event_type: String(type).slice(0, 50),
      email: String(email).slice(0, 200),
      ip_address: ip,
      user_agent: (request.headers.get('user-agent') || 'unknown').slice(0, 500),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // Never expose internal errors
  }
}

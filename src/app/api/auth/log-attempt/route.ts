import { NextResponse, type NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

// Rate limiter for auth log attempts
const authLogMap = new Map<string, { count: number; resetAt: number }>();
const AUTH_LOG_LIMIT = 20;
const AUTH_LOG_WINDOW = 60 * 1000; // 1 minute

function isAuthLogLimited(ip: string): boolean {
  const now = Date.now();
  const entry = authLogMap.get(ip);
  if (!entry || now > entry.resetAt) {
    authLogMap.set(ip, { count: 1, resetAt: now + AUTH_LOG_WINDOW });
    return false;
  }
  entry.count++;
  return entry.count > AUTH_LOG_LIMIT;
}

export async function POST(request: NextRequest) {
  try {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
    if (isAuthLogLimited(ip)) {
      return NextResponse.json({ ok: true }); // Silently drop
    }

    const { type, email } = await request.json();

    if (!type || !email) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
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

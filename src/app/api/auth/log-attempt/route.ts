import { NextResponse, type NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
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
      event_type: type,
      email,
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // Never expose internal errors
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// POST: track paywall event (public)
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });
  }

  const body = await request.json();
  const { event_type, article_id, user_id, session_id } = body;

  if (!event_type || !['view', 'click_subscribe', 'click_login', 'dismiss'].includes(event_type)) {
    return NextResponse.json({ error: 'Type d\'événement invalide' }, { status: 400 });
  }

  const { error } = await supabase
    .from('paywall_analytics')
    .insert({
      event_type,
      article_id: article_id || null,
      user_id: user_id || null,
      session_id: session_id || null,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

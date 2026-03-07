import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

const VALID_EVENTS = [
  'view',
  'click_primary',
  'click_secondary',
  'continue_reading',
  'dismiss',
];

// POST: track paywall/overlay event (public)
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });
  }

  const body = await request.json();
  const {
    event_type,
    article_id,
    user_id,
    session_id,
    scroll_depth,
    read_time_seconds,
    overlay_case,
  } = body;

  if (!event_type || !VALID_EVENTS.includes(event_type)) {
    return NextResponse.json({ error: 'Type d\'evenement invalide' }, { status: 400 });
  }

  const { error } = await supabase
    .from('paywall_analytics')
    .insert({
      event_type,
      article_id: article_id || null,
      user_id: user_id || null,
      session_id: session_id || null,
      scroll_depth: typeof scroll_depth === 'number' && scroll_depth >= 0 && scroll_depth <= 100 ? Math.round(scroll_depth) : null,
      read_time_seconds: typeof read_time_seconds === 'number' && read_time_seconds >= 0 && read_time_seconds < 86400 ? Math.round(read_time_seconds) : null,
      overlay_case: overlay_case || null,
    });

  if (error) {
    // If new columns don't exist yet, fall back to basic insert
    if (error.message.includes('column')) {
      const { error: fallbackError } = await supabase
        .from('paywall_analytics')
        .insert({
          event_type,
          article_id: article_id || null,
          user_id: user_id || null,
          session_id: session_id || null,
        });
      if (fallbackError) {
        return NextResponse.json({ error: fallbackError.message }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

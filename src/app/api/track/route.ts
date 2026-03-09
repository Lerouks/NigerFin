import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

// Simple in-memory rate limiter for tracking endpoint
const trackRateMap = new Map<string, { count: number; resetAt: number }>();
const TRACK_LIMIT = 60; // max page views per IP per window
const TRACK_WINDOW = 60 * 1000; // 1 minute

function isTrackLimited(ip: string): boolean {
  const now = Date.now();
  const entry = trackRateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    trackRateMap.set(ip, { count: 1, resetAt: now + TRACK_WINDOW });
    return false;
  }
  entry.count++;
  return entry.count > TRACK_LIMIT;
}

export async function POST(req: NextRequest) {
  try {
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
    if (isTrackLimited(ip)) {
      return NextResponse.json({ ok: true }); // Silently drop
    }

    const { page_path, article_id, referrer } = await req.json();
    if (!page_path) {
      return NextResponse.json({ error: 'page_path required' }, { status: 400 });
    }

    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ ok: true }); // Silently fail
    }

    await supabase.from('page_views').insert({
      page_path: String(page_path).slice(0, 500),
      article_id: article_id || null,
      referrer: referrer ? String(referrer).slice(0, 500) : null,
      viewed_at: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // Never fail tracking
  }
}

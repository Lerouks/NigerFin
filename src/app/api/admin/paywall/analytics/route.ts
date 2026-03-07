import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';

// GET: fetch paywall analytics summary (admin)
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const { serviceClient } = auth;

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '30', 10);

  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await serviceClient
    .from('paywall_analytics')
    .select('event_type, created_at, scroll_depth, read_time_seconds, overlay_case')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    // Fallback if new columns don't exist
    const { data: fallbackData, error: fallbackError } = await serviceClient
      .from('paywall_analytics')
      .select('event_type, created_at')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false });

    if (fallbackError) {
      return NextResponse.json({ error: fallbackError.message }, { status: 500 });
    }

    return buildResponse(fallbackData || [], days);
  }

  return buildResponse(data || [], days);
}

function buildResponse(data: Array<Record<string, unknown>>, days: number) {
  const summary = {
    views: 0,
    click_primary: 0,
    click_secondary: 0,
    click_subscribe: 0,
    click_login: 0,
    continue_reading: 0,
    dismiss: 0,
    total: data.length,
  };

  const caseBreakdown: Record<string, number> = {};
  let scrollDepthTotal = 0;
  let scrollDepthCount = 0;
  let readTimeTotal = 0;
  let readTimeCount = 0;

  for (const row of data) {
    const eventType = row.event_type as string;
    if (eventType in summary) {
      summary[eventType as keyof typeof summary]++;
    }

    // Track overlay case breakdown
    const overlayCase = row.overlay_case as string | null;
    if (overlayCase) {
      caseBreakdown[overlayCase] = (caseBreakdown[overlayCase] || 0) + 1;
    }

    // Track scroll depth
    const scrollDepth = row.scroll_depth as number | null;
    if (typeof scrollDepth === 'number') {
      scrollDepthTotal += scrollDepth;
      scrollDepthCount++;
    }

    // Track read time
    const readTime = row.read_time_seconds as number | null;
    if (typeof readTime === 'number') {
      readTimeTotal += readTime;
      readTimeCount++;
    }
  }

  const conversions = summary.click_primary + summary.click_secondary + summary.click_subscribe + summary.click_login;

  return NextResponse.json({
    period_days: days,
    ...summary,
    conversion_rate: summary.views > 0
      ? ((conversions / summary.views) * 100).toFixed(1)
      : '0.0',
    avg_scroll_depth: scrollDepthCount > 0
      ? Math.round(scrollDepthTotal / scrollDepthCount)
      : null,
    avg_read_time_seconds: readTimeCount > 0
      ? Math.round(readTimeTotal / readTimeCount)
      : null,
    case_breakdown: caseBreakdown,
  });
}

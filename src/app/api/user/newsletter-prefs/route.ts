import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return NextResponse.json(null);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json(null, { status: 401 });

  const { data } = await supabase
    .from('newsletter_preferences')
    .select('newsletter_monthly, newsletter_weekly, alerts_news, alerts_custom, reports_pdf')
    .eq('user_id', user.id)
    .single();

  return NextResponse.json(data || {
    newsletter_monthly: true,
    newsletter_weekly: false,
    alerts_news: false,
    alerts_custom: false,
    reports_pdf: false,
  });
}

export async function PUT(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await request.json();

  await supabase
    .from('newsletter_preferences')
    .upsert({
      user_id: user.id,
      newsletter_monthly: body.newsletter_monthly ?? true,
      newsletter_weekly: body.newsletter_weekly ?? false,
      alerts_news: body.alerts_news ?? false,
      alerts_custom: body.alerts_custom ?? false,
      reports_pdf: body.reports_pdf ?? false,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

  return NextResponse.json({ success: true });
}

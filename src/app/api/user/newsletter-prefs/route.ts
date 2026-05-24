import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase';
import { parseJsonBody } from '@/lib/validation';

// Qual H-3 : on accepte uniquement les booleens documentes. Tout autre champ
// du body est ignore (allowlist Zod).
const PrefsUpdate = z.object({
  newsletter_monthly: z.boolean().optional(),
  newsletter_weekly: z.boolean().optional(),
  alerts_news: z.boolean().optional(),
  alerts_custom: z.boolean().optional(),
  reports_pdf: z.boolean().optional(),
});

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

  const parsed = await parseJsonBody(request, PrefsUpdate);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  }
  const body = parsed.data;

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

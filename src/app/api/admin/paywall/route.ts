import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin-auth';
import { serverError } from '@/lib/api-error';
import { parseJsonBody } from '@/lib/validation';

// Qual H-3 : allowlist explicite des champs editables. Avant : { ...updates }
// permettait n'importe quelle colonne paywall_config.
const PaywallUpdate = z.object({
  enabled: z.boolean().optional(),
  trigger_type: z.enum(['scroll', 'time', 'percentage', 'article_count']).optional(),
  scroll_percent: z.number().int().min(0).max(100).optional(),
  delay_seconds: z.number().int().min(0).max(600).optional(),
  title: z.string().max(300).nullable().optional(),
  message: z.string().max(2000).nullable().optional(),
  cta_primary_text: z.string().max(120).nullable().optional(),
  cta_secondary_text: z.string().max(120).nullable().optional(),
  free_articles_count: z.number().int().min(0).max(100).optional(),
});

// GET: fetch paywall config (admin)
export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const { serviceClient } = auth;

  const { data, error } = await serviceClient
    .from('paywall_config')
    .select('*')
    .eq('id', 1)
    .single();

  if (error) {
    return serverError(error, 'admin-paywall');
  }

  return NextResponse.json(data);
}

// PUT: update paywall config (admin)
export async function PUT(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const { serviceClient } = auth;

  const parsed = await parseJsonBody(request, PaywallUpdate);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  }

  const { data, error } = await serviceClient
    .from('paywall_config')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', 1)
    .select()
    .single();

  if (error) {
    return serverError(error, 'admin-paywall');
  }

  revalidatePath('/');
  revalidatePath('/articles');
  return NextResponse.json(data);
}

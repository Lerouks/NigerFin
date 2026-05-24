import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin-auth';
import { logAuditEvent } from '@/lib/audit';
import { BILLING_OPTIONS } from '@/config/pricing';
import { serverError } from '@/lib/api-error';
import { parseJsonBody } from '@/lib/validation';

// Build minimum price map from config
const CONFIG_MINIMUMS: Record<string, number> = {};
for (const opt of BILLING_OPTIONS) {
  CONFIG_MINIMUMS[`premium_${opt.cycle}`] = opt.price;
}

// Qual H-3 : validation explicite des entrees admin.
const PriceUpdate = z.object({
  tier: z.enum(['premium']),
  billingCycle: z.enum(['monthly', 'quarterly', 'yearly']),
  amount: z.number().int().min(100).max(10_000_000),
});

// GET: Read current dynamic prices
export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const { serviceClient } = auth;
  const { data } = await serviceClient
    .from('dynamic_pricing')
    .select('*')
    .order('tier')
    .order('billing_cycle');

  return NextResponse.json(data || []);
}

// PUT: Update a price
export async function PUT(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const { user, serviceClient } = auth;
  const parsed = await parseJsonBody(request, PriceUpdate);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  }
  const { tier, billingCycle, amount } = parsed.data;

  const minPrice = CONFIG_MINIMUMS[`${tier}_${billingCycle}`];
  if (minPrice && amount < minPrice) {
    return NextResponse.json(
      { error: `Le prix ne peut pas être inférieur à ${minPrice.toLocaleString('fr-FR')} FCFA` },
      { status: 400 }
    );
  }

  const { error } = await serviceClient
    .from('dynamic_pricing')
    .upsert(
      {
        tier,
        billing_cycle: billingCycle,
        amount,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'tier,billing_cycle' }
    );

  if (error) {
    return serverError(error, 'admin-pricing');
  }

  await logAuditEvent(user.id, 'update_price', 'pricing', `${tier}_${billingCycle}`, {
    tier,
    billingCycle,
    newAmount: amount,
  });

  revalidatePath('/pricing');
  revalidatePath('/paiement');
  return NextResponse.json({ success: true });
}

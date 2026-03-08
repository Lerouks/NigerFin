import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { logAuditEvent } from '@/lib/audit';
import { BILLING_OPTIONS } from '@/config/pricing';
import { serverError } from '@/lib/api-error';

// Build minimum price map from config
const CONFIG_MINIMUMS: Record<string, number> = {};
for (const opt of BILLING_OPTIONS) {
  CONFIG_MINIMUMS[`premium_${opt.cycle}`] = opt.price;
}

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
  const { tier, billingCycle, amount } = await request.json();

  if (!tier || !billingCycle || !amount || amount < 100) {
    return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 });
  }

  const minPrice = CONFIG_MINIMUMS[`${tier}_${billingCycle}`];
  if (minPrice && amount < minPrice) {
    return NextResponse.json(
      { error: `Le prix ne peut pas être inférieur à ${minPrice.toLocaleString('fr-FR')} FCFA` },
      { status: 400 }
    );
  }

  const validTiers = ['premium'];
  const validCycles = ['monthly', 'quarterly', 'yearly'];
  if (!validTiers.includes(tier) || !validCycles.includes(billingCycle)) {
    return NextResponse.json({ error: 'Tier ou cycle invalide' }, { status: 400 });
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

  return NextResponse.json({ success: true });
}

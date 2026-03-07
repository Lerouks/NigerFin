import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { logAuditEvent } from '@/lib/audit';

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

  const validTiers = ['premium'];
  const validCycles = ['monthly'];
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAuditEvent(user.id, 'update_price', 'pricing', `${tier}_${billingCycle}`, {
    tier,
    billingCycle,
    newAmount: amount,
  });

  return NextResponse.json({ success: true });
}

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { BILLING_OPTIONS } from '@/config/pricing';

// Build a map of minimum prices from config defaults
const CONFIG_MINIMUMS: Record<string, number> = {};
for (const opt of BILLING_OPTIONS) {
  CONFIG_MINIMUMS[`premium_${opt.cycle}`] = opt.price;
}

// Public endpoint: returns current prices (dynamic overrides + defaults)
export async function GET() {
  const serviceClient = createServiceClient();
  if (!serviceClient) {
    return NextResponse.json({});
  }

  const { data } = await serviceClient
    .from('dynamic_pricing')
    .select('tier, billing_cycle, amount');

  const priceMap: Record<string, number> = {};
  if (data) {
    for (const row of data) {
      const key = `${row.tier}_${row.billing_cycle}`;
      const minimum = CONFIG_MINIMUMS[key] ?? 0;
      // Never return a price below the configured default
      priceMap[key] = Math.max(row.amount, minimum);
    }
  }

  return NextResponse.json(priceMap, {
    headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
  });
}

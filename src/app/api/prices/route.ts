import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

// Public endpoint: returns current prices (dynamic overrides + defaults)
export async function GET() {
  const serviceClient = createServiceClient();
  if (!serviceClient) {
    return NextResponse.json({});
  }

  const { data } = await serviceClient
    .from('dynamic_pricing')
    .select('tier, billing_cycle, amount');

  // Return as a map: { "premium_monthly": 2500, ... }
  const priceMap: Record<string, number> = {};
  if (data) {
    for (const row of data) {
      priceMap[`${row.tier}_${row.billing_cycle}`] = row.amount;
    }
  }

  return NextResponse.json(priceMap, {
    headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
  });
}

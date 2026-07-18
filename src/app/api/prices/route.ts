import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { resolvePrice, isValidBillingCycle } from '@/config/pricing';

// Endpoint public : prix affiches (override admin plafonne/planche, sinon config).
// Delegue le calcul a resolvePrice (MEME source de verite que la facturation
// getServerPrice) pour que l'affiche colle toujours au debite : plancher = prix
// config, plafond = MAX_DYNAMIC_PRICE. Ne renvoie une cle que pour les cycles
// ayant un override ; le client retombe sinon sur le prix config.
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
      if (row.tier !== 'premium' || !isValidBillingCycle(row.billing_cycle)) continue;
      priceMap[`premium_${row.billing_cycle}`] = resolvePrice(row.billing_cycle, row.amount);
    }
  }

  // Fenetre de cache courte : borne l'ecart affiche/debite juste apres un
  // changement de prix admin (le prix DEBITE, lui, est toujours resolu en direct).
  return NextResponse.json(priceMap, {
    headers: { 'Cache-Control': 's-maxage=15, stale-while-revalidate=60' },
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const { serviceClient } = auth;

  const [regions, resources, indicators, facts, partners] = await Promise.all([
    serviceClient.from('niger_regions').select('*').order('name'),
    serviceClient.from('niger_resources').select('*, niger_regions(name)').order('name'),
    serviceClient.from('niger_economic_indicators').select('*').order('display_order'),
    serviceClient.from('niger_country_facts').select('*').order('display_order'),
    serviceClient.from('niger_partners').select('*').order('display_order'),
  ]);

  return NextResponse.json({
    regions: regions.data || [],
    resources: resources.data || [],
    indicators: indicators.data || [],
    facts: facts.data || [],
    partners: partners.data || [],
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const { serviceClient } = auth;

  const body = await request.json();
  const { action, table, data, id } = body;

  const validTables = [
    'niger_regions',
    'niger_resources',
    'niger_resource_history',
    'niger_economic_indicators',
    'niger_indicator_history',
    'niger_country_facts',
    'niger_partners',
  ];

  if (!validTables.includes(table)) {
    return NextResponse.json({ error: 'Table invalide' }, { status: 400 });
  }

  try {
    if (action === 'insert') {
      const { error } = await serviceClient.from(table).insert(data);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === 'update' && id) {
      const { error } = await serviceClient.from(table).update({ ...data, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === 'delete' && id) {
      const { error } = await serviceClient.from(table).delete().eq('id', id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

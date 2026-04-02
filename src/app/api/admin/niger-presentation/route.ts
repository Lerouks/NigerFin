import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { serverError } from '@/lib/api-error';

export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const [presentationRes, factsRes, indicatorsRes, regionsRes, resourcesRes] = await Promise.all([
    auth.serviceClient.from('niger_presentation').select('*').eq('id', 1).single(),
    auth.serviceClient.from('niger_country_facts').select('*').order('display_order', { ascending: true }),
    auth.serviceClient.from('niger_economic_indicators').select('*').order('display_order', { ascending: true }),
    auth.serviceClient.from('niger_regions').select('*').order('name'),
    auth.serviceClient.from('niger_resources').select('*').order('economic_importance'),
  ]);

  return NextResponse.json({
    presentation: presentationRes.data || {},
    facts: factsRes.data || [],
    indicators: indicatorsRes.data || [],
    regions: regionsRes.data || [],
    resources: resourcesRes.data || [],
  });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const body = await req.json();

  // Update presentation (map, intro)
  if (body.presentation) {
    const { error } = await auth.serviceClient
      .from('niger_presentation')
      .update({
        map_image_url: body.presentation.map_image_url,
        map_image_alt: body.presentation.map_image_alt,
        intro_title: body.presentation.intro_title,
        intro_text: body.presentation.intro_text,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1);

    if (error) return serverError(error, 'admin-niger-presentation');
  }

  // Update facts in parallel
  if (Array.isArray(body.facts)) {
    const factUpdates = body.facts
      .filter((fact: { id?: string }) => fact.id)
      .map((fact: { id: string; label: string; value: string; display_order: number; category: string; is_visible: boolean }) =>
        auth.serviceClient
          .from('niger_country_facts')
          .update({
            label: fact.label,
            value: fact.value,
            display_order: fact.display_order,
            category: fact.category,
            is_visible: fact.is_visible,
          })
          .eq('id', fact.id)
      );
    await Promise.all(factUpdates);
  }

  // Update indicators in parallel
  if (Array.isArray(body.indicators)) {
    const indicatorUpdates = body.indicators
      .filter((ind: { id?: string }) => ind.id)
      .map((ind: { id: string; label: string; value: string; previous_value: string; unit: string; category: string; display_order: number; is_visible: boolean }) =>
        auth.serviceClient
          .from('niger_economic_indicators')
          .update({
            label: ind.label,
            value: ind.value,
            previous_value: ind.previous_value,
            unit: ind.unit,
            category: ind.category,
            display_order: ind.display_order,
            is_visible: ind.is_visible,
          })
          .eq('id', ind.id)
      );
    await Promise.all(indicatorUpdates);
  }

  // Update regions in parallel
  if (Array.isArray(body.regions)) {
    const regionUpdates = body.regions
      .filter((region: { id?: string }) => region.id)
      .map((region: { id: string; name: string; capital: string; population: number; area_km2: number; economic_activities: string[]; natural_resources: string[]; security_level: string; security_note: string; is_visible: boolean }) =>
        auth.serviceClient
          .from('niger_regions')
          .update({
            name: region.name,
            capital: region.capital,
            population: region.population,
            area_km2: region.area_km2,
            economic_activities: region.economic_activities,
            natural_resources: region.natural_resources,
            security_level: region.security_level,
            security_note: region.security_note,
            is_visible: region.is_visible,
          })
          .eq('id', region.id)
      );
    await Promise.all(regionUpdates);
  }

  // Update resources in parallel
  if (Array.isArray(body.resources)) {
    const resourceUpdates = body.resources
      .filter((res: { id?: string }) => res.id)
      .map((res: { id: string; name: string; type: string; location_name: string; estimated_production: string; production_unit: string; operating_companies: string[]; economic_importance: string; importance_description: string; is_visible: boolean }) =>
        auth.serviceClient
          .from('niger_resources')
          .update({
            name: res.name,
            type: res.type,
            location_name: res.location_name,
            estimated_production: res.estimated_production,
            production_unit: res.production_unit,
            operating_companies: res.operating_companies,
            economic_importance: res.economic_importance,
            importance_description: res.importance_description,
            is_visible: res.is_visible,
          })
          .eq('id', res.id)
      );
    await Promise.all(resourceUpdates);
  }

  return NextResponse.json({ success: true });
}

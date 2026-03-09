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

  // Update facts
  if (Array.isArray(body.facts)) {
    for (const fact of body.facts) {
      if (!fact.id) continue;
      await auth.serviceClient
        .from('niger_country_facts')
        .update({
          label: fact.label,
          value: fact.value,
          display_order: fact.display_order,
          category: fact.category,
          is_visible: fact.is_visible,
        })
        .eq('id', fact.id);
    }
  }

  // Update indicators
  if (Array.isArray(body.indicators)) {
    for (const ind of body.indicators) {
      if (!ind.id) continue;
      await auth.serviceClient
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
        .eq('id', ind.id);
    }
  }

  // Update regions
  if (Array.isArray(body.regions)) {
    for (const region of body.regions) {
      if (!region.id) continue;
      await auth.serviceClient
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
        .eq('id', region.id);
    }
  }

  // Update resources
  if (Array.isArray(body.resources)) {
    for (const res of body.resources) {
      if (!res.id) continue;
      await auth.serviceClient
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
        .eq('id', res.id);
    }
  }

  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { serverError } from '@/lib/api-error';

export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const [presentationRes, factsRes] = await Promise.all([
    auth.serviceClient.from('niger_presentation').select('*').eq('id', 1).single(),
    auth.serviceClient.from('niger_country_facts').select('*').order('display_order', { ascending: true }),
  ]);

  return NextResponse.json({
    presentation: presentationRes.data || {},
    facts: factsRes.data || [],
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
        })
        .eq('id', fact.id);
    }
  }

  return NextResponse.json({ success: true });
}

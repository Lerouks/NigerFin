import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { serverError } from '@/lib/api-error';
import { mettreALaCorbeille } from '@/lib/corbeille';
import { revaliderPagesLegales as revalidateAllLegalPages } from '@/lib/revalidation-contenus';
import { isValidUUID, safeParseJSON } from '@/lib/validation';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const slug = req.nextUrl.searchParams.get('page') || 'mentions-legales';

  const { data, error } = await auth.serviceClient
    .from('legal_sections')
    .select('*')
    .eq('page_slug', slug)
    .order('display_order', { ascending: true });

  if (error) return serverError(error, 'admin-legal-sections');

  return NextResponse.json(data || []);
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const { sections } = await req.json();

  if (!Array.isArray(sections)) {
    return NextResponse.json({ error: 'sections array required' }, { status: 400 });
  }

  for (const section of sections) {
    if (!section.id) continue;
    const { error } = await auth.serviceClient
      .from('legal_sections')
      .update({
        heading: section.heading,
        text: section.text,
        display_order: section.display_order,
        updated_at: new Date().toISOString(),
      })
      .eq('id', section.id);

    if (error) return serverError(error, 'admin-legal-sections');
  }

  revalidateAllLegalPages();
  return NextResponse.json({ success: true });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const { page_slug, heading, text, display_order } = await req.json();

  if (!page_slug || !heading) {
    return NextResponse.json({ error: 'page_slug and heading required' }, { status: 400 });
  }

  const { data, error } = await auth.serviceClient
    .from('legal_sections')
    .insert({ page_slug, heading, text: text || '', display_order: display_order || 0 })
    .select()
    .single();

  if (error) return serverError(error, 'admin-legal-sections');

  revalidateAllLegalPages();
  return NextResponse.json(data);
}

// DELETE: la section part à la corbeille. La corbeille rafraîchit elle-même
// les pages légales, avec la même liste qu'à la restauration.
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const corps = await safeParseJSON<{ id?: unknown }>(req);
  if (!corps || !isValidUUID(corps.id)) {
    return NextResponse.json({ error: 'Identifiant de section manquant ou invalide.' }, { status: 400 });
  }

  const resultat = await mettreALaCorbeille(auth.serviceClient, 'legal_sections', corps.id, auth.user.id);
  if (!resultat.ok) return NextResponse.json({ error: resultat.motif }, { status: resultat.statut });
  return NextResponse.json({ success: true, corbeille: true, idCorbeille: resultat.idCorbeille });
}

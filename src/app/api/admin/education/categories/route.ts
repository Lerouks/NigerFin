import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin-auth';
import { serverError } from '@/lib/api-error';
import { mettreALaCorbeille } from '@/lib/corbeille';
import { isValidUUID } from '@/lib/validation';

// GET: liste les catégories avec le nombre de leçons.
// Lit avec la clé de service et exige le rôle administrateur, comme les autres
// verbes de cette route (voir la note dans lessons/route.ts).
export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const { serviceClient } = auth;

  const { data: categories, error: catError } = await serviceClient
    .from('education_categories')
    .select('*, education_lessons(id)')
    .order('sort_order');

  if (catError) {
    return serverError(catError, 'admin-education-categories');
  }

  const result = (categories || []).map((cat: Record<string, unknown> & { education_lessons?: { id: string }[] }) => ({
    ...cat,
    lesson_count: cat.education_lessons?.length || 0,
    education_lessons: undefined,
  }));

  return NextResponse.json(result);
}

// POST: create category
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const { serviceClient } = auth;

  const body = await request.json();
  const { title, slug, icon, available, sort_order, description } = body;

  if (!title || !slug) {
    return NextResponse.json({ error: 'Titre et slug requis' }, { status: 400 });
  }

  const { data, error } = await serviceClient
    .from('education_categories')
    .insert({
      title,
      slug,
      icon: icon || 'BookOpen',
      available: available ?? false,
      sort_order: sort_order ?? 0,
      description: description || '',
    })
    .select()
    .single();

  if (error) {
    return serverError(error, 'admin-education-categories');
  }

  revalidatePath('/education');
  return NextResponse.json(data);
}

// PUT: update category
export async function PUT(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const { serviceClient } = auth;

  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: 'ID requis' }, { status: 400 });
  }

  updates.updated_at = new Date().toISOString();

  const { data, error } = await serviceClient
    .from('education_categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return serverError(error, 'admin-education-categories');
  }

  revalidatePath('/education');
  return NextResponse.json(data);
}

// DELETE: la catégorie part à la corbeille. La base efface en cascade toutes
// ses leçons, et avec elles leurs étapes de parcours et la progression des
// lecteurs : tout est copié, et tout revient ensemble à la restauration.
export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const id = new URL(request.url).searchParams.get('id');
  if (!isValidUUID(id)) {
    return NextResponse.json({ error: 'Identifiant de catégorie manquant ou invalide.' }, { status: 400 });
  }

  const resultat = await mettreALaCorbeille(auth.serviceClient, 'education_categories', id, auth.user.id);
  if (!resultat.ok) return NextResponse.json({ error: resultat.motif }, { status: resultat.statut });
  return NextResponse.json({ success: true, corbeille: true, idCorbeille: resultat.idCorbeille });
}

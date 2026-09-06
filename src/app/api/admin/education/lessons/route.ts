import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin-auth';
import { serverError } from '@/lib/api-error';

// GET: liste les leçons d'une catégorie.
//
// Lit avec la clé de service, comme les trois autres verbes de cette route.
// Auparavant elle lisait avec la clé du visiteur : depuis la migration 00031,
// qui a fermé la fuite du contenu payant en retirant le SELECT au niveau table
// puis en le réaccordant colonne par colonne, un select('*') avec cette clé
// échoue. L'admin recevait une erreur 500 et affichait « Aucune leçon » alors
// que la base en contient 73. Au passage, ce GET n'exigeait aucune
// authentification : le contrôle requireAdmin est désormais le même partout.
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const { serviceClient } = auth;

  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get('category_id');

  let query = serviceClient
    .from('education_lessons')
    .select('*')
    .order('sort_order');

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const { data, error } = await query;

  if (error) {
    return serverError(error, 'admin-education-lessons');
  }

  return NextResponse.json(data);
}

// POST: create lesson
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const { serviceClient } = auth;

  const body = await request.json();
  const { category_id, title, duration, access_level, sort_order, content } = body;

  if (!category_id || !title) {
    return NextResponse.json({ error: 'Catégorie et titre requis' }, { status: 400 });
  }

  if (access_level && !['free', 'premium'].includes(access_level)) {
    return NextResponse.json({ error: 'Niveau d\'accès invalide' }, { status: 400 });
  }

  const { data, error } = await serviceClient
    .from('education_lessons')
    .insert({
      category_id,
      title,
      duration: duration || '5 min',
      access_level: access_level || 'free',
      sort_order: sort_order ?? 0,
      content: content || '',
    })
    .select()
    .single();

  if (error) {
    return serverError(error, 'admin-education-lessons');
  }

  revalidatePath('/education');
  return NextResponse.json(data);
}

// PUT: update lesson
export async function PUT(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const { serviceClient } = auth;

  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: 'ID requis' }, { status: 400 });
  }

  if (updates.access_level && !['free', 'premium'].includes(updates.access_level)) {
    return NextResponse.json({ error: 'Niveau d\'accès invalide' }, { status: 400 });
  }

  updates.updated_at = new Date().toISOString();

  const { data, error } = await serviceClient
    .from('education_lessons')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return serverError(error, 'admin-education-lessons');
  }

  revalidatePath('/education');
  return NextResponse.json(data);
}

// DELETE: remove lesson
export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const { serviceClient } = auth;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID requis' }, { status: 400 });
  }

  const { error } = await serviceClient
    .from('education_lessons')
    .delete()
    .eq('id', id);

  if (error) {
    return serverError(error, 'admin-education-lessons');
  }

  revalidatePath('/education');
  return NextResponse.json({ success: true });
}

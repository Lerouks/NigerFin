import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { createServerSupabaseClient } from '@/lib/supabase';

// GET: list all categories with lesson counts
export async function GET() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });
  }

  const { data: categories, error: catError } = await supabase
    .from('education_categories')
    .select('*, education_lessons(id)')
    .order('sort_order');

  if (catError) {
    return NextResponse.json({ error: catError.message }, { status: 500 });
  }

  const result = (categories || []).map((cat: any) => ({
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
  const { title, slug, icon, available, sort_order } = body;

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
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE: remove category (cascades to lessons)
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
    .from('education_categories')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

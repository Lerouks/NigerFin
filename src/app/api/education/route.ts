import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { serverError } from '@/lib/api-error';

// Public GET: list available categories with lesson counts
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });
  }

  const slug = request.nextUrl.searchParams.get('slug');
  const categoryId = request.nextUrl.searchParams.get('category_id');

  // If category_id is provided, return lessons for that category
  if (categoryId) {
    const { data, error } = await supabase
      .from('education_lessons')
      .select('id, title, duration, access_level, sort_order, content')
      .eq('category_id', categoryId)
      .order('sort_order');

    if (error) return serverError(error, 'education-lessons');

    // Check user subscription to decide whether to strip premium content
    const { data: { user } } = await supabase.auth.getUser();
    let userRole: string | null = null;
    if (user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role, subscription_status')
        .eq('id', user.id)
        .single();
      if (profile && profile.subscription_status === 'active') {
        userRole = profile.role;
      }
    }

    const isPremiumUser = userRole === 'premium' || userRole === 'admin' || userRole === 'pro';

    // Strip content from non-free lessons for non-premium users
    const sanitized = (data || []).map((lesson: Record<string, unknown>) => {
      if (lesson.access_level === 'free' || isPremiumUser) {
        return lesson;
      }
      return { ...lesson, content: '' };
    });

    return NextResponse.json(sanitized);
  }

  // If slug is provided, return that single category
  if (slug) {
    const { data, error } = await supabase
      .from('education_categories')
      .select('id, slug, title, icon, description, available, education_lessons(id)')
      .eq('slug', slug)
      .eq('available', true)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Catégorie introuvable' }, { status: 404 });
    }

    return NextResponse.json({
      ...data,
      lesson_count: data.education_lessons?.length || 0,
      education_lessons: undefined,
    });
  }

  // Default: list all available categories
  const { data: categories, error } = await supabase
    .from('education_categories')
    .select('id, slug, title, icon, description, available, education_lessons(id)')
    .eq('available', true)
    .order('sort_order');

  if (error) return serverError(error, 'education-categories');

  const result = (categories || []).map((cat: Record<string, unknown> & { education_lessons?: { id: string }[] }) => ({
    ...cat,
    lesson_count: cat.education_lessons?.length || 0,
    education_lessons: undefined,
  }));

  return NextResponse.json(result);
}

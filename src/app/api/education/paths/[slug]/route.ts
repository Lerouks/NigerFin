import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { serverError } from '@/lib/api-error';

interface StepLessonRow {
  sort_order: number;
  education_lessons: {
    id: string;
    title: string;
    duration: string;
    access_level: 'free' | 'premium';
    category_id: string;
  } | null;
}

function minutesFromDuration(raw: string | undefined): number {
  if (!raw) return 0;
  const match = raw.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });
  }

  const { data: path, error: pathError } = await supabase
    .from('learning_paths')
    .select('id, slug, title, description, icon, difficulty, goal_label')
    .eq('slug', slug)
    .eq('available', true)
    .single();

  if (pathError || !path) {
    return NextResponse.json({ error: 'Parcours introuvable' }, { status: 404 });
  }

  const { data: stepsData, error: stepsError } = await supabase
    .from('learning_path_steps')
    .select(
      'sort_order, education_lessons(id, title, duration, access_level, category_id)',
    )
    .eq('path_id', path.id)
    .order('sort_order');

  if (stepsError) return serverError(stepsError, 'learning-path-steps');

  const steps = (stepsData || []) as unknown as StepLessonRow[];
  const lessonIds = steps
    .map((s) => s.education_lessons?.id)
    .filter((id): id is string => !!id);
  const categoryIds = Array.from(
    new Set(
      steps
        .map((s) => s.education_lessons?.category_id)
        .filter((id): id is string => !!id),
    ),
  );

  const { data: cats } = await supabase
    .from('education_categories')
    .select('id, slug, title')
    .in('id', categoryIds);

  const catMap = new Map(
    (cats || []).map((c: { id: string; slug: string; title: string }) => [
      c.id,
      { slug: c.slug, title: c.title },
    ]),
  );

  const { data: { user } } = await supabase.auth.getUser();
  let progressMap = new Map<string, { completed_at: string | null; quiz_score: number | null }>();
  if (user && lessonIds.length > 0) {
    const { data: prog } = await supabase
      .from('user_lesson_progress')
      .select('lesson_id, completed_at, quiz_score')
      .eq('user_id', user.id)
      .in('lesson_id', lessonIds);
    progressMap = new Map(
      (prog || []).map((p: { lesson_id: string; completed_at: string | null; quiz_score: number | null }) => [
        p.lesson_id,
        { completed_at: p.completed_at, quiz_score: p.quiz_score },
      ]),
    );
  }

  const lessons = steps
    .map((s) => {
      const l = s.education_lessons;
      if (!l) return null;
      const prog = progressMap.get(l.id) ?? null;
      return {
        step_order: s.sort_order,
        id: l.id,
        title: l.title,
        duration: l.duration,
        access_level: l.access_level,
        category: catMap.get(l.category_id) ?? { slug: '', title: '' },
        completed: !!prog?.completed_at,
        completed_at: prog?.completed_at ?? null,
        quiz_score: prog?.quiz_score ?? null,
      };
    })
    .filter((l): l is NonNullable<typeof l> => l !== null);

  const totalMinutes = lessons.reduce(
    (sum, l) => sum + minutesFromDuration(l.duration),
    0,
  );
  const completedCount = lessons.filter((l) => l.completed).length;

  return NextResponse.json({
    id: path.id,
    slug: path.slug,
    title: path.title,
    description: path.description,
    icon: path.icon,
    difficulty: path.difficulty,
    goal_label: path.goal_label,
    total_minutes: totalMinutes,
    step_count: lessons.length,
    completed_count: completedCount,
    is_signed_in: !!user,
    lessons,
  });
}

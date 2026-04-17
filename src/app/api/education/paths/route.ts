import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { serverError } from '@/lib/api-error';

interface PathRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  difficulty: string;
  goal_label: string;
  sort_order: number;
  learning_path_steps: Array<{
    lesson_id: string;
    education_lessons: { duration: string } | null;
  }>;
}

function minutesFromDuration(raw: string | undefined): number {
  if (!raw) return 0;
  const match = raw.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

export async function GET() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });
  }

  const { data: paths, error } = await supabase
    .from('learning_paths')
    .select(
      'id, slug, title, description, icon, difficulty, goal_label, sort_order, learning_path_steps(lesson_id, education_lessons(duration))',
    )
    .eq('available', true)
    .order('sort_order');

  if (error) return serverError(error, 'learning-paths');

  const { data: { user } } = await supabase.auth.getUser();
  let completedIds = new Set<string>();
  if (user) {
    const { data: prog } = await supabase
      .from('user_lesson_progress')
      .select('lesson_id')
      .eq('user_id', user.id)
      .not('completed_at', 'is', null);
    completedIds = new Set((prog || []).map((p) => p.lesson_id as string));
  }

  const rows = (paths || []) as unknown as PathRow[];
  const result = rows.map((p) => {
    const steps = p.learning_path_steps || [];
    const totalMinutes = steps.reduce(
      (sum, s) => sum + minutesFromDuration(s.education_lessons?.duration),
      0,
    );
    const completed = steps.filter((s) => completedIds.has(s.lesson_id)).length;
    return {
      id: p.id,
      slug: p.slug,
      title: p.title,
      description: p.description,
      icon: p.icon,
      difficulty: p.difficulty,
      goal_label: p.goal_label,
      sort_order: p.sort_order,
      step_count: steps.length,
      total_minutes: totalMinutes,
      completed_count: completed,
      is_signed_in: !!user,
    };
  });

  return NextResponse.json(result);
}

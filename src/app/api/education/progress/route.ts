import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { serverError } from '@/lib/api-error';
import { isValidUUID } from '@/lib/validation';

/** Progression du lecteur connecté dans Apprendre : leçons lues et score des questions de fin. */
export async function GET() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json([]);

  const { data, error } = await supabase
    .from('user_lesson_progress')
    .select('lesson_id, completed_at, last_viewed_at, quiz_score')
    .eq('user_id', user.id);

  if (error) return serverError(error, 'progress-get');
  return NextResponse.json(data || [], { headers: { 'Cache-Control': 'private, no-store' } });
}

/**
 * Enregistre la lecture d'une leçon (`completed`) et/ou le score de sa question
 * de fin (`quiz_score`, de 0 à 100). Un champ absent n'est pas touché : noter
 * le score ne décoche pas une leçon déjà lue.
 */
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Connexion requise' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'Corps invalide' }, { status: 400 });
  }

  const { lesson_id, completed, quiz_score } = body as { lesson_id?: unknown; completed?: unknown; quiz_score?: unknown };

  if (!isValidUUID(lesson_id)) {
    return NextResponse.json({ error: 'lesson_id invalide' }, { status: 400 });
  }
  if (completed !== undefined && typeof completed !== 'boolean') {
    return NextResponse.json({ error: 'completed doit être vrai ou faux' }, { status: 400 });
  }
  if (
    quiz_score !== undefined &&
    (typeof quiz_score !== 'number' || !Number.isInteger(quiz_score) || quiz_score < 0 || quiz_score > 100)
  ) {
    return NextResponse.json({ error: 'quiz_score doit être un entier de 0 à 100' }, { status: 400 });
  }
  if (completed === undefined && quiz_score === undefined) {
    return NextResponse.json({ error: 'Rien à enregistrer' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const payload: Record<string, unknown> = {
    user_id: user.id,
    lesson_id,
    last_viewed_at: now,
  };
  if (completed !== undefined) payload.completed_at = completed ? now : null;
  if (quiz_score !== undefined) payload.quiz_score = quiz_score;

  const { data, error } = await supabase
    .from('user_lesson_progress')
    .upsert(payload, { onConflict: 'user_id,lesson_id' })
    .select('lesson_id, completed_at, last_viewed_at, quiz_score')
    .single();

  if (error) return serverError(error, 'progress-upsert');
  return NextResponse.json(data);
}
